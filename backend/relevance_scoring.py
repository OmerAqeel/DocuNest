from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer

class RelevanceScorer:
    def __init__(self):
        """
        Initialise the model for embedding generation
        """
        self.model = SentenceTransformer('all-mpnet-base-v2')
        self.nlp = spacy.load('en_core_web_sm')  # Load spaCy for NER and POS tagging

    def generate_embeddings(self, sentences):
        """
        Generate embeddings for the list of the text chunks that will be coming from the S3 bucket
        """
        return self.model.encode(sentences)

    def calculate_relevancy(self, query_embedding, chunk_embeddings):
        """
        Calculate the relevancy score between the query and the text chunks
        """
        # Reshape embeddings to ensure they are 2D
        query_embedding = np.atleast_2d(query_embedding)
        chunk_embeddings = np.atleast_2d(chunk_embeddings)
        
        return cosine_similarity(query_embedding, chunk_embeddings)[0]

    def extract_key_terms(self, query):
        """
        Dynamically extract key terms from the user query using NER, POS, and TF-IDF.
        """
        # Step 1: Extract named entities using NER (e.g., application, tool names)
        doc = self.nlp(query)
        entities = [ent.text.lower() for ent in doc.ents]
        
        # Step 2: Extract nouns and verbs using POS tagging (key action words and subjects)
        nouns_verbs = [token.text.lower() for token in doc if token.pos_ in ['NOUN', 'PROPN', 'VERB']]
        
        # Step 3: Use TF-IDF to extract important terms based on frequency in the query
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform([query])
        feature_names = tfidf.get_feature_names_out()
        scores = tfidf_matrix.toarray()[0]
        
        # Combine results: Use NER, POS, and TF-IDF terms
        key_terms = set(entities + nouns_verbs + [feature_names[i] for i in scores.argsort()[-3:]])  # Get top 3 TF-IDF terms
        
        return key_terms

    def get_most_relevant_chunk(self, query, chunks, chunk_embeddings, top_n=3):
        """
        Find the most relevant chunks to the query based on cosine similarity and key term extraction.
        """
        # Extract key terms from the query
        key_terms = self.extract_key_terms(query)
        
        # Generate the embedding for the query
        query_embedding = self.model.encode([query])
        
        # Calculate the cosine similarity between the query and the chunks
        similarity_scores = self.calculate_relevancy(query_embedding, chunk_embeddings)
        
        # Adjust scores based on presence of key terms in the chunks
        adjusted_scores = []
        for i, chunk in enumerate(chunks):
            score = similarity_scores[i]
            # Boost score if chunk contains any of the key terms extracted from the query
            for term in key_terms:
                if term in chunk.lower():  # Ensure case-insensitive matching
                    score += 0.2  # Boost score (adjust this value as necessary)
            adjusted_scores.append(score)

        # Get the indices of the top N most relevant chunks
        top_indices = np.argsort(adjusted_scores)[-top_n:][::-1]

        # Return the top N most relevant chunks and their adjusted similarity scores
        relevant_chunks = [(chunks[i], adjusted_scores[i]) for i in top_indices]
        return relevant_chunks
