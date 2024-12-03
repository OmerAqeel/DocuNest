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
            />
            <br />
            <Input
              // className="email-input"
              type="password"
              placeholder="Password"
              style={{
                width: "40vw",
              }}
            />
          </CardContent>
          <CardFooter>
            <Button >Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};
