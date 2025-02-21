import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
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
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PanelRight } from "lucide-react";
import { CircleX } from "lucide-react";
import { TbLayoutSidebar } from "react-icons/tb";
import { RiChatNewLine } from "react-icons/ri";


export const Chat = () => {
  const user = localStorage.getItem("persist:root");
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); // Store chat messages
  const [prompt, setPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState(""); // Welcome message state
  const [showWelcome, setShowWelcome] = useState(messages.length === 0 ? true : false); // Control welcome visibility
  const { assistantId, conversationID } = useParams();
  const [isTyping, setIsTyping] = useState(false); // Animation state
  const [isThinking, setIsThinking] = useState(false);
  const [botMessage, setBotMessage] = useState(""); // For bot message streaming
  const typingSpeed = 25; // Speed of the typing animation (ms per letter)
  const [displaySubText, setDisplaySubText] = useState(false);
  const [file, setFile] = useState("");
  const fileViewer = useRef(null); // For file viewer reference
  const [fileData, setFileData] = useState({ url: "", type: "" });
  const [chatMiniMode, setChatMiniMode] = useState(false); // For mini mode state
  const [sideBarOpened, setSideBarOpened] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [workspaceColor, setWorkspaceColor] = useState("");
  const userOnWorkspaceAssistant = sessionStorage.getItem("userOnWorkspaceAssistant");

  // Move the workspaceColor state update into useEffect
  useEffect(() => {
    if (sessionStorage.getItem("userOnWorkspaceAssistant") === "true") {
      const color = sessionStorage.getItem("workspaceColor");
      setWorkspaceColor(color);
    }
  }, []); // Runs once on mount

  const parsedUser = JSON.parse(user);
  const userData = parsedUser?.userData
    ? JSON.parse(parsedUser.userData)
    : null;
  const userName = userData?.Name || "User";
  const user_id = userData?.user_id;

  useEffect(() => {
    // Simulate typing animation for the welcome message
    simulateWelcomeMessage(`What can I help you with, ${userName} ?`);
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

  const handleSideBarOpen = () => {
    setSideBarOpened(!sideBarOpened);
  };

  const handleBackBtnClick = async () => {
    // sessionStorage.setItem("workspaceName", "");
    window.history.back();

    if (messages.length > 0) {
      try {
        await axios.post("http://localhost:8000/save-conversation/", {
          user_id: user_id, // ✅ Send directly in the body
          conversation_id: conversationID,
          assistant_id: assistantId,
          messages: messages,
        });
      } catch (error) {
        console.error("Error saving conversation:", error);
      }
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/get-conversations/",
        {
          params: {
            user_id: user_id,
            assistant_id: assistantId,
            conversationID: conversationID,
          },
        }
      );
      setConversations(response.data.conversations);
      console.log("Conversations:", response.data.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const handleSendMessage = async () => {
    if (prompt.trim() === "") return;

    const newMessage = { sender: "user", text: prompt };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    console.log("Prompt:", prompt);
    console.log("messages:", messages);

    setPrompt("");
    setShowWelcome(false);

    // Show the "thinking" state (three dots animation)
    setIsThinking(true);
    const userOnWorkspaceAssistant = sessionStorage.getItem("userOnWorkspaceAssistant");
    const workspaceName = sessionStorage.getItem("workspaceName");
    
    const userIdParam = userOnWorkspaceAssistant === "true" ? workspaceName : user_id;

    try {
      const response = await axios.get("http://localhost:8000/ask/", {
        params: {
          user_id: userIdParam,
          assistant_id: assistantId,
          query: prompt,
        },
      });

      const botResponse = response.data.response;
      const file = response.data.file;

      simulateBotResponse(botResponse, file);
      setFile(file);
      console.log("File:", file);
    } catch (error) {
      console.error("Error fetching response:", error);
      simulateBotResponse("Sorry, something went wrong. Please try again.");
    } finally {
      // Set "thinking" state to false once the bot responds
      setIsThinking(false);
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
    if (sideBarOpened) {
      setSideBarOpened(false);
    }
    try {
      const workspaceName = sessionStorage.getItem("workspaceName");
      const userIdParam = userOnWorkspaceAssistant === "true" ? workspaceName : user_id;
      
      const response = await axios.get(
        `http://localhost:8000/get-file/${fileName}`,
        {
          params: {
            assistant_id: assistantId,
            user_id: userIdParam,
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
  };

  const handleSelectConversation = (convId) => {
    setShowWelcome(false);
    navigate(`/chat/${assistantId}/${convId}`);
  };

  const handleNewChat = async () => {
    const newConversationID = uuidv4();
    setShowWelcome(true);
    setMessages([]);
    setWelcomeMessage(`What can I help you with, ${userName} ?`);
    navigate(`/chat/${assistantId}/${newConversationID}`);
  }


  const h1Style = {
    color: "gray", // Fill color of the text
    WebkitTextStroke: "1px black", // Stroke size and color
    fontSize: "60px", // Font size
    textAlign: "center", // Optional alignment
  };

  // Helper function to convert hex to RGBA
const hexToRgba = (hex, alpha = 1) => {
  // Remove the '#' if present
  hex = hex.replace('#', '');

  // If shorthand form (e.g. "3b8"), convert to full form ("33bb88")
  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }

  // Parse r, g, b values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


  useEffect(() => {
    if (conversationID) {
      const currentConversation = conversations.find(
        (conv) => conv.conversationID === conversationID
      );
      if (currentConversation) {
        setMessages(currentConversation.messages);
        setWelcomeMessage(false);
      }
    }
  }, [conversationID, conversations]);

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <>
      <TooltipProvider>
        <ResizablePanelGroup orientation="horizontal" direction="horizontal">
          <div
            className={`main-container ${sideBarOpened ? "sidebar-open" : ""}`}
          >
            <div
              className={`sidebar ${sideBarOpened ? "open" : ""}`}
              style={{
                backgroundColor: workspaceColor|| "#373c44",
                width: "20vw",
                height: "100vh",
                position: "absolute",
                left: "0",
                cursor: "pointer",
              }}
            >
              <br />
              <h3 className="sidebar-title">Conversations</h3>
              {conversations.map((conv) => (
                <div
                  key={conv.conversationID}
                  className="conversation-item"
                  onClick={() => handleSelectConversation(conv.conversationID)}
                >
                  {conv.title}
                </div>
              ))}
            </div>
            <ResizablePanel>
              <div className="btn-container">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TbLayoutSidebar
                      size={25}
                      onClick={handleSideBarOpen}
                      {...(sideBarOpened
                        ? { color: "white" }
                        : { color: "black" })}
                      style={{
                        zIndex: "1000",
                        cursor: "pointer",
                        marginLeft: "10px",
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sidebar</p>
                  </TooltipContent>
                  <RiChatNewLine size={25} 
                   onClick={handleNewChat}
                  {...(sideBarOpened
                    ? { color: "white" }
                    : { color: "black" })
                  }
                  style={{
                    zIndex: "1000",
                    cursor: "pointer",
                    position: "absolute",
                    left: "60px",
                  }}
                  />
                  <Button onClick={handleBackBtnClick}
                  style={{
                    backgroundColor: workspaceColor || "black",
                    marginLeft: "10px",
                    marginTop: "10px",
                    borderRadius: "15px",
                  }}
                  >
                    <ArrowLeft size={24} /> Back
                  </Button>
                </Tooltip>
              </div>
              <div
                className="chat-container"
                {...(sideBarOpened
                  ? { style: { marginLeft: "20vw", width: "80vw" } }
                  : { style: { marginLeft: "0" } })}
              >
                <div className="chat-box-container">
                  {(showWelcome && messages.length === 0) && (
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
                      style={{
                        backgroundColor: message.sender === "bot" ? hexToRgba(workspaceColor, 0.1) : (workspaceColor || "#818cf8"),
                      }
                      }
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
                                      backgroundColor: "818cf8",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "white";
                                      e.target.style.color = "818cf8";
                                      e.target.style.border =
                                        "1px solid 818cf8";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "818cf8";
                                      e.target.style.color = "white";
                                      e.target.style.border = "none";
                                    }}
                                  >
                                    <File size={20} />
                                    {
                                      message.text
                                        .split("Source File: ")[1]
                                        .split(".")[0]
                                    }
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
                      backgroundColor: workspaceColor || "black",
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
                  style={{ backgroundColor: "gray" }}
                ></ResizableHandle>
                <ResizablePanel>
                  <div className="file-viewer" ref={fileViewer}>
                    {chatMiniMode && (
                      <div className="file-viewer-header">
                        <h1
                          style={{
                            fontSize: "20px",
                            fontFamily: "sans-serif",
                            fontWeight: "bold",
                            fontStyle: "underline",
                          }}
                        >
                          Source File Preview
                        </h1>
                        <Button
                          onClick={handleCloseFileViewer}
                          style={{
                            backgroundColor: "red",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "white";
                            e.target.style.color = "red";
                            e.target.style.border = "1px solid red";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "red";
                            e.target.style.color = "white";
                          }}
                        >
                          <CircleX /> Close
                        </Button>
                      </div>
                    )}
                    <div className="file-viewer-content">
                      <iframe
                        src={fileData.url}
                        title="File Preview"
                        width="100%"
                        style={{
                          border: "none",
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
      </TooltipProvider>
    </>
  );
};

export default Chat;
