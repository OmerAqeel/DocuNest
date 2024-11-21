from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class RelevanceScorer:
    def __init__(self):
        """
        Initialise the model for embedding generation
        """
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
    
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
        
        # Squeeze any unnecessary extra dimensions
        if chunk_embeddings.shape[2:] == (1,):
            chunk_embeddings = chunk_embeddings.squeeze(axis=2)

        return cosine_similarity(query_embedding, chunk_embeddings)[0]
    
    def get_most_relevant_chunk(self, query, chunks, chunk_embeddings, top_n=3):
        """
        Find the most relevant chunks to the query based on cosine similarity.

        Parameters:
        - query: The user query as a string.
        - chunks: List of text chunks to search in.
        - chunk_embeddings: List of embeddings for each chunk.
        - top_n: Number of top relevant chunks to return.

        Returns:
        - A list of tuples with (chunk, similarity_score) for the top N relevant chunks.
        """
        # Generate the embedding for the query
        query_embedding = self.model.encode([query])
        
        # Calculate the cosine similarity between the query and the chunks
        similarity_scores = self.calculate_relevancy(query_embedding, chunk_embeddings)
        
        # Get the indices of the top N most relevant chunks
        top_indices = np.argsort(similarity_scores)[-top_n:][::-1]

        # Return the top N most relevant chunks and their similarity scores
        relevant_chunks = [(chunks[i], similarity_scores[i]) for i in top_indices]
        return relevant_chunks
