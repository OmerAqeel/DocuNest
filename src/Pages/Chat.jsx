import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../Styles/Chat.css";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { ArrowLeft } from 'lucide-react';
import { SendHorizontal } from 'lucide-react';


export const Chat = () => {
  // Fetch user data from localStorage
  const user = localStorage.getItem("persist:root");
  const [text, setText] = useState(""); // For animation
  const [fullText, setFullText] = useState(""); // Full text to display
  const typingSpeed = 30; // Typing speed in milliseconds
  const [promptEntered, setPromptEntered] = useState(false);
  const [prompt, setPrompt] = useState("");
  const { assistantId } = useParams(); // Get assistantId from URL
  console.log("assistanID: ",assistantId);

  // Parse user data safely
  const parsedUser = JSON.parse(user);
  const userData = parsedUser?.userData
    ? JSON.parse(parsedUser.userData)
    : null;



  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  }


  // Check if prompt is entered
  useEffect(() => {
    if(prompt.length > 0) {
      setPromptEntered(true);
    }
    if(prompt.length === 0) {
      setPromptEntered(false);
    }
  }, [prompt]);


  // Set the full text after user data is ready
  useEffect(() => {
    if (userData && userData.Name) {
      setFullText(`Welcome ${userData.Name}`); // Set the full message
    } else {
      setFullText("Welcome User"); // Fallback if Name is missing
    }
  }, [userData]); // Dependency ensures this runs when userData updates

  // Typing animation
  useEffect(() => {
    // Guard clause to avoid errors
    if (!fullText) return;

    let index = 0; // Start at the first character
    let currentText = ""; // Temporary string to build the animation

    const typeText = () => {
      if (index < fullText.length) {
        currentText += fullText[index]; // Add one letter at a time
        setText(currentText); // Update state
        index++;
        setTimeout(typeText, typingSpeed); // Continue the animation
      }
    };

    setText(""); // Clear text immediately before animation
    typeText(); // Start animation
  }, [fullText]);

  const h1Style = {
    color: 'gray', // Fill color of the text
    WebkitTextStroke: '0.5px black', // Stroke size and color
    fontSize: '40px', // Font size
  }


  // Render component
  return (
    <div className="chat-container">
      <div className="btn-container"

      >
        <Button 
        onClick={() => {
          window.history.back();
        }
        }
        >
          <ArrowLeft size={24} /> Back
        </Button>
      </div>
      <div className="chat-box-container">

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
        disabled={!promptEntered}
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
