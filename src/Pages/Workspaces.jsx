import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import '../Styles/Workspaces.css';

export const Workspaces = (workspacesCreated) => {
  const [workspacesList, setWorkspacesList] = useState([]);
  const [workspaceColors, setWorkspaceColors] = useState({});

  const listOfColors = [
    "#a5f3fc", // Light blue
    "#86efac", // Light green
    "#fef1ca", // Light yellow
    "#fca5a5", // Light red
    "#d9f99d", // Light green
    "#3b82f6", // Blue
    "#A5B4FB", // Light purple
  ];

  const user = localStorage.getItem("persist:root");
  const parsedUser = JSON.parse(user).userData;
  let JSONparsedUser = JSON.parse(parsedUser);
  const userEmail = JSONparsedUser?.email;


useEffect(() => {
  const fetchWorkspaces = async () => {
    try {
      const response = await axios.get("http://localhost:8000/get-workspaces", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
        params: {
          email: userEmail, // Pass email as query param
        },
      });

      const workspaceNames = response.data.workspaces.map(
        (workspace) => workspace.name
      );
      setWorkspacesList(workspaceNames);

      const savedColors = JSON.parse(localStorage.getItem("workspaceColors")) || {};
      const newColors = { ...savedColors };
      const availableColors = [...listOfColors];

      workspaceNames.forEach((workspace) => {
        if (!newColors[workspace]) {
          const color = availableColors.shift();
          if (color) {
            newColors[workspace] = color;
          } else {
            newColors[workspace] =
              listOfColors[Math.floor(Math.random() * listOfColors.length)];
          }
        }
      });

      localStorage.setItem("workspaceColors", JSON.stringify(newColors));
      setWorkspaceColors(newColors);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    }
  };

  fetchWorkspaces();
}, [userEmail, workspacesCreated]);

  return (
    <>
      <div className="workspaces-cards">
        {workspacesList.length === 0 ? (
          <h1 style={{ textAlign: "center", color: "gray" }}>
            You have no workspaces
          </h1>
        ) : (
          <div
            style={{
              display: "flex",
              margin: "0.5rem",
              alignItems: "center",
              flexDirection: "row",
              gap: "1.5rem",
              overflowX: "auto", // Add horizontal scroll
              padding: "10px",
            }}
          >
            {workspacesList.map((workspace) => (
              <Card
                key={workspace}
                className="workspace-card"
                style={{
                  width: "20vw",
                  height: "25vh",
                  borderRadius: "20px",
                  boxShadow: "0 0 6px rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  gap: "1rem",
                }}
              >
                <CardHeader
                  id="workspace-card-header"
                  style={{
                    backgroundColor: workspaceColors[workspace] || "#ddd",
                    color: "white",
                    width: "9vw",
                    height: "9vw",
                    borderRadius: "50%",
                    textAlign: "center",
                    marginTop: "1rem",
                  }}
                >
                  <CardTitle style={{ fontSize: "2rem", marginTop: "1.5rem" }}>
                    {
                      workspace.split(" ")[0].charAt(0).toUpperCase() +
                      (workspace.split(" ")[1]
                        ? workspace.split(" ")[1].charAt(0).toUpperCase()
                        : "")
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    <h1
                      style={{
                        fontWeight: "semi-bold",
                        fontFamily: "sans-serif",
                        textAlign: "center",
                        color: "black",
                      }}
                    >
                      {workspace}
                    </h1>
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Workspaces;
