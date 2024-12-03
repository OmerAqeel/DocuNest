import React from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // Corrected import
import { useEffect, useState } from "react";
import { VscHubot } from "react-icons/vsc";
import "../Styles/SignUp.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaChevronRight } from "react-icons/fa";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SignUp = () => {
  const userID = uuidv4(); // Use uuidv4 to generate user ID
  const [nameIsValid, setNameIsValid] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [buttonDisabled, setButtonDisabled] = useState("true");
  const [valid, setValid] = useState("");
  const [firstStep, setFirstStep] = useState(true);
  const [secondStep, setSecondStep] = useState(false);
  const [thirdStep, setThirdStep] = useState(false);
  const [emailIsValid, setEmailIsValid] = useState(false);

  useEffect(() => {
    if (name.length >= 2) {
      setValid("-valid");
      setButtonDisabled("false");
    } else {
      setNameIsValid(false);
      setValid("");
    }
  }, [name]);

  useEffect(() => {
    if (emailIsValid) {
      setButtonDisabled("false");
      setValid("-valid");
    } else {
      setButtonDisabled("true");
      setValid("");
    }
  }, [emailIsValid, secondStep]);

  useEffect(() => {
    if (password.length >= 8) {
      setButtonDisabled("false");
      setValid("-valid");
    } else {
      setButtonDisabled("true");
      setValid("");
    }
  }, [password, thirdStep]);

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleEmailChange = (e) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);

    // Validate email using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailIsValid(emailRegex.test(inputEmail));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleContinueClick = () => {
    if (valid === "-valid" && firstStep) {
      setFirstStep(false);
      setSecondStep(true);
      console.log(`Name: ${name}`);
    } else if (emailIsValid && secondStep) {
      setSecondStep(false);
      setThirdStep(true);
      console.log(`Email: ${email}`);
    } else if (valid === "-valid" && thirdStep) {
      setSecondStep(false);
      setThirdStep(true);
      console.log(`
      Name: ${name}
      Email: ${email}
      Password
      `);
    }
  };

  const handleSubmitBtn = async () => {
    try {
      const response = await axios.post("http://localhost:8000/signup/", {
        user_id: userID,
        name,
        email,
        password,
      });
  
      if (response.status === 200) {
        console.log("User saved successfully:", response.data);
        alert("Sign-up successful!");
      }
    } catch (error) {
      console.error("Error saving user:", error.response?.data || error.message);
      alert("Failed to sign up. Please try again.");
    }
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
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>To DocuNest</CardDescription>
          </CardHeader>
          <CardContent>
            {firstStep ? (
              <Input
                type="name"
                placeholder="Name"
                style={{
                  width: "40vw",
                }}
                onChange={handleNameChange}
                value={name}
              />
            ) : null}
            {secondStep ? (
              <Input
                className="email-input"
                type="email"
                placeholder="Email"
                style={{
                  width: "40vw",
                }}
                onChange={handleEmailChange}
                value={email}
              />
            ) : null}
            {thirdStep ? (
              <Input
                className="password-input"
                type="password"
                placeholder="Password"
                style={{
                  width: "40vw",
                }}
                onChange={handlePasswordChange}
                value={password}
              />
            ) : null}
          </CardContent>
          <CardFooter>
            <Button
              className={`continue-btn${valid}`}
              disable={buttonDisabled}
              onClick={thirdStep ? handleSubmitBtn : handleContinueClick}
            >
              {firstStep ? (
                <>
                  Continue <FaChevronRight />
                </>
              ) : secondStep ? (
                <>
                  Continue <FaChevronRight />
                </>
              ) : (
                "Done"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};
