import { React, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { VscHubot } from "react-icons/vsc";
import "../Styles/Navbar.css";
import { Link, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Settings } from "lucide-react";
import { UserPen } from "lucide-react";
import { LogOut } from "lucide-react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelector } from "react-redux";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [textEntered, setTextEntered] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationRead, setNotificationRead] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // ✅ Track dropdown state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const handleEmailChange = (e) => {
    setTextEntered(e.target.value);
    setIsValid(true);
  };

  useEffect(() => {
    if (textEntered.length === 0) {
      setIsValid(false);
    }
    if (textEntered.length > 0) {
      setIsValid(true);
    }
  }, [textEntered]);

  // Extract the assistantId from the pathname
  const match = location.pathname.match(/\/chat\/([^/]+)/);
  const assistantId = match ? match[1] : null;

  const user = localStorage.getItem("persist:root");

  const parsedUser = JSON.parse(user).userData;

  let JSONparsedUser = JSON.parse(parsedUser);

  // getting the name of the assistant from the local storage using the assistantId
  const assistantData = JSONparsedUser?.assistants;

  const userNotificationsData = JSONparsedUser?.notifications;

  const assistantName = assistantData?.find(
    (assistant) => assistant.id === assistantId
  )?.name;
  console.log(assistantName);

  const userData = useSelector((state) => state.user.userData);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    try {
      // Retrieve token from local storage or Redux
      const token = sessionStorage.getItem("authToken"); // Adjust key if needed

      if (!token) {
        console.error("No token found");
        return;
      }

      // Make API call with token
      const response = await axios.get("http://localhost:8000/notifications", {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to Authorization header
        },
      });

      const { notifications: fetchedNotifications } = response.data;

      setNotifications(fetchedNotifications);
      const count = fetchedNotifications.length;
      setNotificationCount(count);
      console.log("Notifications fetched:", fetchedNotifications);
      console.log("Notification count:", count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // **Toggle Dropdown**
  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  // **Fetch Notifications**
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) return;
        const response = await axios.get(
          "http://localhost:8000/notifications",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setNotifications(response.data.notifications);
        setNotificationCount(response.data.notifications.length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  const handleNotificationClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNotificationOpen(!isNotificationOpen);
  };

  // **Mark as Read When Dropdown Closes**
  useEffect(() => {
    if (!dropdownOpen && notifications.length > 0) {
      clearNotifications();
    }
  }, [dropdownOpen]);

  // **Clear Notifications**
  const clearNotifications = async () => {
    try {
      await axios.post("http://localhost:8000/clear-notifications", null, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
      });
      setNotifications([]);
      setNotificationCount(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const hasClearedNotifications = useRef(false); // ✅ Track if the API has already been called

  const handleCloseNotifications = async () => {
    try {
      if (!notificationRead && notifications.length > 0) {
        await axios.post("http://localhost:8000/clear-notifications", null, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        });

        setNotificationRead(true);
        setNotificationCount(0);
        setNotifications([]);
      }
      setIsNotificationOpen(false);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // useEffect(() => {
  //   document.getElementById("notification-btn")?.addEventListener("click", handleNotificationClick);

  //   return () => {
  //     document.getElementById("notification-btn")?.removeEventListener("click", handleNotificationClick);
  //   };
  // }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("notification-dropdown");
      const button = document.getElementById("notification-btn");

      if (
        dropdown &&
        !dropdown.contains(event.target) &&
        !button.contains(event.target)
      ) {
        handleCloseNotifications();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationRead, notifications]);

  return (
    <div
      className="header-container"
      onMouseEnter={(e) => (e.target.style.cursor = "pointer")}
    >
      <h1 className="header-title" onClick={() => navigate("/dashboard")}>
        <VscHubot size={35} /> DocuNest
      </h1>
      {location.pathname === "/signup" ? (
        <Link to="/signin">
          <Button className="signIn-btn">Sign In</Button>
        </Link>
      ) : location.pathname === "/signin" ? (
        <Link to="/signup">
          <Button className="signIn-btn">Sign Up</Button>
        </Link>
      ) : location.pathname === "/dashboard" ||
        /^\/[^/]+\/[^/]+$/.test(location.pathname) ||
        location.pathname === "/profile" ? (
        <div className="dashboard-actions">
          <DropdownMenu
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "6vw",
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button className="contact-btn" variant="outline">
                Contact us
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel
                style={{
                  color: "gray",
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginTop: "10px",
                }}
              >
                Please write your query below:
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                <Textarea
                  style={{
                    marginRight: "10px",
                    marginLeft: "10px",
                    marginTop: "10px",
                    width: "20vw",
                    height: "19vh",
                    marginBottom: "10px",
                    borderRadius: "10px",
                    outline: "none",
                    resize: "none",
                  }}
                  placeholder="Type here"
                  value={textEntered}
                  onChange={handleEmailChange}
                />
                <Button
                  style={{
                    borderRadius: "10px",
                    width: "6vw",
                    outline: "none",
                    fontSize: "12px",
                    marginLeft: "210px",
                    marginTop: "10px",
                    marginBottom: "10px",
                    backgroundColor: "#0284c7",
                    fontWeight: "bold",
                  }}
                  disabled={!isValid}
                >
                  Submit
                </Button>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Modified Notification Section */}
          <div
            className="notification-container"
            style={{ position: "relative" }}
          >
            <button
              id="notification-btn"
              className="notification-btn"
              onClick={handleNotificationClick}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                padding: "8px",
                cursor: "pointer",
              }}
            >
              <Bell style={{ height: "22px", width: "22px" }} />
              {notificationCount > 0 && !notificationRead && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    backgroundColor: "red",
                    color: "white",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "12px",
                    textAlign: "center",
                    lineHeight: "16px",
                  }}
                >
                  {notificationCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div
                id="notification-dropdown"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: "50%",
                  transform: "translateX(50%)",
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  width: "250px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  zIndex: 50,
                  marginTop: "8px",
                }}
              >
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "10px",
                        fontSize: "14px",
                        borderBottom: "1px solid #eee",
                        textAlign: "left", // Added this to align text to the left
                        width: "100%", // Added to ensure full width
                      }}
                    >
                      {notification}
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "10px",
                      fontSize: "14px",
                      textAlign: "left", // Added this to align "No notifications" to the left
                    }}
                  >
                    No notifications
                  </div>
                )}
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="profile-btn"
                style={{
                  borderRadius: "15px",
                  outline: "none",
                }}
              >
                <User size={20} color="white" />
                {userData?.Name}
                <ChevronDown size={20} color="white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserPen size={15} />
                  <Link to="/profile">User details</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings size={15} />
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut size={15} />
                  <Link to="/logout">Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : location.pathname === `/chat/${assistantId}` ? (
        <div
          className="assistant-name-container"
          style={
            assistantName
              ? {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "43.5vw",
                }
              : { display: "none" }
          }
        >
          <h1
            className="assistant-name"
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              fontStyle: "italic",
            }}
          >
            {assistantName}
          </h1>
        </div>
      ) : null}
    </div>
  );
};
