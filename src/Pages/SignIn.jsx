import React from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import { VscHubot } from "react-icons/vsc";
import "../Styles/SignIn.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export const SignIn = () => {
  const [valid, setValid] = useState("");
  const [emailEntered, setEmailEntered] = useState("");
  const [passwordEntered, setPasswordEntered] = useState("");
  const [wrongCredentials, setWrongCredentials] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmailEntered(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPasswordEntered(e.target.value);
  };

  useEffect(() => {
    if (emailEntered.length > 0) {
      setValid("-valid");
    } else {
      setValid("");
    }
  }, [emailEntered]);

  const navigate = useNavigate();

  const signInUser = async (email, password) => {
    setLoading(true); // Start spinner
    const MIN_SPINNER_TIME = 500; 
    const startTime = Date.now(); // Record the start time

    try {
      const response = await axios.post("http://localhost:8000/signin/", { email, password });
      const token = response.data.access_token;
      sessionStorage.setItem("authToken", token);
      setWrongCredentials(false);

      // Redirect to Dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setWrongCredentials(true);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(MIN_SPINNER_TIME - elapsedTime, 0);

      // Ensure the spinner is visible for at least 1 second
      setTimeout(() => {
        setLoading(false); // Stop spinner
      }, remainingTime);
    }
  };

  return (
    <>
      <div className={`alert-container ${wrongCredentials ? "fade-in" : ""}`}>
        {wrongCredentials && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Wrong email or password. Please try again.
            </AlertDescription>
          </Alert>
        )}
      </div>
      <div className="signIn-content">
        <Card className="signUp-card">
          <CardHeader>
            <CardTitle style={{ display: "flex", justifyContent: "center", fontSize: "3rem" }}>
              <VscHubot />
            </CardTitle>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>To DocuNest</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="email"
              placeholder="Email"
              style={{ width: "40vw" }}
              onChange={handleEmailChange}
              value={emailEntered}
            />
            <br />
            <Input
              type="password"
              placeholder="Password"
              style={{ width: "40vw" }}
              onChange={handlePasswordChange}
              value={passwordEntered}
            />
          </CardContent>
          <CardFooter>
            <Button className={`continue-btn${valid}`} onClick={() => signInUser(emailEntered, passwordEntered)}>
              {loading ? (
                <span className="spinner" style={{ borderTopColor: "white" }} />
              ) : (
                "Sign In"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};
