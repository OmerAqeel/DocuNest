import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "../Styles/Chat.css";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { ArrowLeft } from "lucide-react";
import { SendHorizontal } from "lucide-react";
import { File } from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { CircleX } from 'lucide-react';

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
  const [file, setFile] = useState("");
  const fileViewer = useRef(null); // For file viewer reference

  const [fileUrl, setFileUrl] = useState(""); // URL of the file
  const [fileContent, setFileContent] = useState(null); // For text content
  const [fileType, setFileType] = useState(""); // For identifying the file type
  const [fileData, setFileData] = useState({ url: "", type: "" });

  const [fileOpened, setFileOpened] = useState(false); // For file viewer state
  const [chatMiniMode, setChatMiniMode] = useState(false); // For mini mode state

  const parsedUser = JSON.parse(user);
  const userData = parsedUser?.userData
    ? JSON.parse(parsedUser.userData)
    : null;
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
        if (index === message.length) {
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
      const botResponse = response.data.response;
      const file = response.data.file;

      // Simulate bot response animation
      simulateBotResponse(botResponse, file);
      setFile(file);
      // Optionally, you can log the file name or display it somewhere
      console.log("File:", file);
    } catch (error) {
      console.error("Error fetching response:", error);
      simulateBotResponse("Sorry, something went wrong. Please try again.");
    }
  };

  const simulateBotResponse = (response, file) => {
    if (!response || typeof response !== "string") return;

    let index = 0;
    let currentMessage = "";

    setBotMessage("");
    setIsTyping(true);

    const typeLetter = () => {
      if (index < response.length) {
        currentMessage += response[index];
        setBotMessage(currentMessage);
        index++;
        setTimeout(typeLetter, typingSpeed);
      } else {
        setIsTyping(false);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "bot",
            text: file
              ? response + " \n " + `Source File: ${file}`
              : response + " \n " + `Source File: ${file}`,
          },
        ]);
      }
    };

    typeLetter();
  };

  const handleFileClick = async (fileName) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/get-file/${fileName}`,
        {
          params: {
            assistant_id: assistantId,
            user_id: user_id,
          },
        }
      );

      setFileData({
        url: response.data.url,
        type: response.data.content_type,
      });

      const chatContainer = document.querySelector(".chat-container");
      chatContainer.classList.toggle("mini"); // Toggle mini mode for the chat container
      setChatMiniMode(true); // Toggle mini mode state
    } catch (error) {
      console.error("Error fetching file:", error);
    }
  };

  const handleCloseFileViewer = () => {
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer.classList.contains("mini")) {
      chatContainer.classList.remove("mini");
      setChatMiniMode(false);
    }
    setFileData({ url: "", type: "" });
  }


  const h1Style = {
    color: "gray", // Fill color of the text
    WebkitTextStroke: "1px black", // Stroke size and color
    fontSize: "60px", // Font size
    textAlign: "center", // Optional alignment
  };

  return (
    <>
    <ResizablePanelGroup orientation="horizontal"
    direction="horizontal"
    >
      <div className="main-container">
        <ResizablePanel>
        <div className="chat-container">
          <div className="btn-container">
            <Button onClick={() => window.history.back()}>
              <ArrowLeft size={24} /> Back
            </Button>
          </div>

          <div className="chat-box-container">
            {showWelcome && (
              <div className="welcome-container">
                <h1
                  className={`welcome-message ${
                    !showWelcome ? "fade-out" : ""
                  }`}
                  style={h1Style}
                >
                  {welcomeMessage}
                </h1>
                {displaySubText && (
                  <p
                    style={{
                      textAlign: "center",
                      color: "gray",
                      fontSize: "17px",
                      fontStyle: "italic",
                    }}
                  >
                    Please let me know what information you'd like me to
                    retrieve.
                  </p>
                )}
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat-message ${message.sender}-message`}
              >
                {message.sender === "bot" ? (
                  <div>
                    {/* Render markdown text */}
                    <ReactMarkdown>
                      {message.text.split("Source File:")[0]}
                    </ReactMarkdown>

                    {/* Render the source file outside ReactMarkdown */}
                    {message.text.includes("Source File:") && (
                      <div className="source-file-link">
                        <br />
                        {message.text.split("Source File: ")[1] && (
                          <>
                            <Button
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleFileClick(
                                  message.text.split("Source File: ")[1]
                                );
                              }}
                              style={{
                                cursor: "pointer",
                                backgroundColor: "darkgray",
                              }}
                            >
                              <File size={20} />
                              {message.text.split("Source File: ")[1].split(".")[0]}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  message.text
                )}
              </div>
            ))}

            {isTyping && (
              <div className="chat-message bot-message">
                <ReactMarkdown>{botMessage}</ReactMarkdown>
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
        </ResizablePanel>
        
        {fileData.url && (
          <>
          <ResizableHandle
          style={{ backgroundColor: "gray",
           }}
          ></ResizableHandle>
          <ResizablePanel>
          <div className="file-viewer" ref={fileViewer}>
            { chatMiniMode &&
            <div className="file-viewer-header">
            <Button 
            onClick={handleCloseFileViewer}
            >
             <CircleX/> Close
            </Button>
            </div>
        }
            <div className="file-viewer-content">
            <iframe
              src={fileData.url}
              title="File Preview"
              width="100%"
              style={{ border: "none", 
                height: "100vh",
                marginLeft: "2px",
              }}
            />
            </div>
          </div>
          </ResizablePanel>
          </>
        )}
      </div>
      </ResizablePanelGroup>
    </>
  );
};

export default Chat;
