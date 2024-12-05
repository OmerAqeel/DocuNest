import React from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import { VscHubot } from "react-icons/vsc";
import "../Styles/SignIn.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SignIn = () => {
  const [valid, setValid] = useState("");
  const [emailEntered, setEmailEntered] = useState("");
  const [passwordEntered, setPasswordEntered] = useState("");

  const handleEmailChange = (e) => {
    setEmailEntered(e.target.value);
    console.log(emailEntered);
  };

  const handlePasswordChange = (e) => {
    setPasswordEntered(e.target.value);
    console.log(passwordEntered);
  };

  useEffect(() => {
    if (emailEntered.length > 0) {
      setValid("-valid");
    } else {
      setValid("");
    }
  }, [emailEntered]);

  const signInUser = async (email, password) => {
    try {
      const response = await axios.post("http://localhost:8000/signin/", { email, password });
      const token = response.data.access_token;
      sessionStorage.setItem("authToken", token);
    } catch (error) {
      console.error("Error signing in:", error.response?.data || error.message);
    }
  };
  
  const apiRequest = async () => {
    const token = sessionStorage.getItem("authToken");
    const response = await axios.get("http://localhost:8000/protected-route/", {
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  return (
    <>
      <div className="signIn-content">
        <Card className="signUp-card">
          <CardHeader>
            <CardTitle
              style={{
                display: "flex",
                justifyContent: "center",
                fontSize: "3rem",
              }}
            >
              <VscHubot />
            </CardTitle>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>To DocuNest</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              // className="email-input"
              type="email"
              placeholder="Email"
              style={{
                width: "40vw",
              }}
              onChange={handleEmailChange}
              value={emailEntered}
            />
            <br />
            <Input
              // className="email-input"
              type="password"
              placeholder="Password"
              style={{
                width: "40vw",
              }}
              onChange={handlePasswordChange}
              value={passwordEntered}
            />
          </CardContent>
          <CardFooter>
            <Button className={`continue-btn${valid}`} 
              onClick={() => signInUser(emailEntered, passwordEntered)}
            >Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};
