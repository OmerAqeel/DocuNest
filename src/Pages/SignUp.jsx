import React from "react";
import { VscHubot } from "react-icons/vsc";
import "../Styles/SignIn.css";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SignUp = () => {
  return (
    <>
      <div className="header-container">
        <h1 className="header-title">
          {" "}
          <VscHubot /> DocuNest
        </h1>
        <Button className="signIn-btn">Sign In</Button>
      </div>
      <div className="signIn-content">
        <Card className="signUp-card">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card Content</p>
          </CardContent>
          <CardFooter>
            <p>Card Footer</p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};
