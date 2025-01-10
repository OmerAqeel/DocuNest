import {React, useEffect, useState} from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

export const Navbar = () => {
  const location = useLocation();
  const [textEntered, setTextEntered] = useState("");
  const [isValid, setIsValid] = useState(false);

  const handleEmailChange = (e) => {
    setTextEntered(e.target.value);
    setIsValid(true);
  };

  useEffect(() => {
    if (textEntered.length === 0) {
      setIsValid(false);
    }
    if(textEntered.length > 0){
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

  const assistantName = assistantData?.find((assistant) => assistant.id === assistantId)?.name;
  console.log(assistantName);


  const userData = useSelector((state) => state.user.userData);

  return (
    <div className="header-container">
      <h1 className="header-title">
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
      ) : location.pathname === "/dashboard" ? (
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
                  >
                  </Textarea>

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
                  }}
                  disabled={!isValid}
                >
                  Submit
                </Button>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  <Link to="/profile">Profile</Link>
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
          <h1 className="assistant-name"
          style={{
            fontSize: '20px', // Font size
            fontWeight: 'bold',
            fontStyle: 'italic',
          }}
          >{assistantName}</h1>
        </div>
      )
        : null }
    </div>
  );
};
