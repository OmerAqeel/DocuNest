import React, {useState} from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import '../Styles/Profile.css'
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Profile = () => {
  const user = localStorage.getItem("persist:root");

  const[editBtnClicked, setEditBtnClicked] = useState(false);
  const[openAIKey, setOpenAIKey] = useState("");

  const handleEditBtnClick = () => {
    setEditBtnClicked(!editBtnClicked);
  }

  const parsedUser = JSON.parse(user).userData;

  let JSONparsedUser = JSON.parse(parsedUser);

  // getting the name of the user from the local storage
  const Name = JSONparsedUser?.Name;
  const Email = JSONparsedUser?.email;


  return (
    <div 
    className="profile-container"
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "80vh",
    }}
    >
      <Card
        className="profile-card"
        style={{ width: "700px", height: "350px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "left",
        alignItems: "center",
         }}
      >
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription
            style={{
              display: "flex",
              gap: "10px",
              // color: "black",
              flexDirection: "column",
              // justifyContent: "center",
              alignItems: "center",
            }}
          >
            <p>{`Username: ${Name}`}</p>
            <p>{`Email: ${Email}`}</p>
            <div className="api-key-container"
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "10px",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "10px",
              // width: "100%",
            }}>
            <Label
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "200px",
                color: "black",
              }}
            >OpenAI API Key</Label>
            <Input
              type="text"
              placeholder="Enter OpenAI API Key"
              className="mt-2"
              // type="password"
              disabled={!editBtnClicked}
            />  
            <Button
              // variant="outline"
              style={{ borderRadius: "10px", width: "100px" }}
              onClick={handleEditBtnClick}
            >
              {editBtnClicked ? "Save" : "Edit"}
            </Button>
            </div>
            </CardDescription>
            </CardContent>
            <CardFooter>
            </CardFooter>
          </Card>
    </div>
  )
}
