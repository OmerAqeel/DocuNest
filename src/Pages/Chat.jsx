import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../Styles/Chat.css";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { ArrowLeft } from "lucide-react";
import { SendHorizontal } from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

export const Chat = () => {
  const user = localStorage.getItem("persist:root");
  const [messages, setMessages] = useState([]); // Store chat messages
  const [prompt, setPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState(""); // Welcome message state
  const [showWelcome, setShowWelcome] = useState(true); // Control welcome visibility
  const { assistantId } = useParams();
  const [isTyping, setIsTyping] = useState(false); // Animation state
  const [botMessage, setBotMessage] = useState(""); // For bot message streaming
  const typingSpeed = 50; // Speed of the typing animation (ms per letter)
  const [displaySubText, setDisplaySubText] = useState(false);

  const parsedUser = JSON.parse(user);
  const userData = parsedUser?.userData ? JSON.parse(parsedUser.userData) : null;
  const userName = userData?.Name || "User";
  const user_id = userData?.user_id;

  useEffect(() => {
    // Simulate typing animation for the welcome message
    simulateWelcomeMessage(`Welcome ${userName}`);
  }, [userName]);

  const simulateWelcomeMessage = (message) => {
    let index = 0; // Start at the first character
    const typeLetter = () => {
      if (index < message.length) {
        setWelcomeMessage(message.substring(0, index + 1)); // Update the state with the current substring
        index++;
        setTimeout(typeLetter, typingSpeed); // Schedule the next letter
        if(index === message.length){
          setDisplaySubText(true);
        }
      }
    };

    typeLetter(); // Start typing animation
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleSendMessage = async () => {
    if (prompt.trim() === "") return;
  
    // Add user message to the chat
    const newMessage = { sender: "user", text: prompt };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  
    setPrompt("");
    setShowWelcome(false); // Fade out the welcome message
  
    try {
      // Call the backend endpoint
      const response = await axios.get("http://localhost:8000/ask/", {
        params: {
          user_id: user_id,
          assistant_id: assistantId, // From useParams
          query: prompt,
        },
      });
  
      // Extract the bot response and filename from the API response
      const { response: botResponse, file } = response.data;
  
      // Simulate bot response animation
      simulateBotResponse(botResponse);
  
      // Optionally, you can log the file name or display it somewhere
      console.log("File:", file);
    } catch (error) {
      console.error("Error fetching response:", error);
      simulateBotResponse("Sorry, something went wrong. Please try again.");
    }
  };
  

  const simulateBotResponse = (response) => {
    if (!response || typeof response !== "string") return; // Safety check for response
    let index = 0; // Start at the first character
    let currentMessage = ""; // Temporary variable to build the message

    setBotMessage(""); // Clear any existing bot message
    setIsTyping(true); // Start typing animation

    const typeLetter = () => {
      if (index < response.length) {
        currentMessage += response[index]; // Append the next character
        setBotMessage(currentMessage); // Update the botMessage state
        index++;
        setTimeout(typeLetter, typingSpeed); // Schedule the next character
      } else {
        setIsTyping(false); // Typing animation ends
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: response },
        ]); // Add the full response to messages
      }
    };

    typeLetter(); // Start the typing animation
  };

  const h1Style = {
    color: 'gray', // Fill color of the text
    WebkitTextStroke: '1px black', // Stroke size and color
    fontSize: '60px', // Font size
    textAlign: 'center', // Optional alignment
  };

  return (
    <div className="chat-container">
      <div className="btn-container">
        <Button onClick={() => window.history.back()}>
          <ArrowLeft size={24} /> Back
        </Button>
      </div>

      <div className="chat-box-container">
        {showWelcome && (
          <div className="welcome-container">
          <h1 className={`welcome-message ${!showWelcome ? "fade-out" : ""}`}
          style={h1Style}
          >
            {welcomeMessage}
          </h1>
          {displaySubText && (
          <p
          style={
            {
              textAlign: 'center',
              color: 'gray',
              fontSize: '17px',
              fontStyle: 'italic',
            }
          }
          >Please let me know what information you'd like me to retrieve.</p>
        )}
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${
              message.sender === "user" ? "user-message" : "bot-message"
            }`}
          >
            {message.text}
          </div>
        ))}
        {isTyping && (
          <div className="chat-message bot-message">
            <ReactMarkdown>
            {botMessage}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="chat-input-container">
        <Input
          type="text"
          placeholder="Type a message..."
          value={prompt}
          onChange={handlePromptChange}
          style={{
            borderRadius: "15px",
            outline: "none",
            width: "80%",
          }}
        />
        <Button
          disabled={prompt.trim() === ""}
          onClick={handleSendMessage}
          style={{
            borderRadius: "15px",
            outline: "none",
          }}
        >
          <SendHorizontal size={20} color="white" /> Send
        </Button>
      </div>
    </div>
  );
};

export default Chat;
