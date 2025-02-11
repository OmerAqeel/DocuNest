import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import '../Styles/Workspaces.css';


export const WorkspacesContainer = (workspacesCreated) => {
  const [workspacesList, setWorkspacesList] = useState([]);
  const [workspaceColors, setWorkspaceColors] = useState({});
  const navigate = useNavigate();

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
  const userName = JSONparsedUser?.Name;


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

      const workspaceNames = response.data.workspaces.map((workspace) => ({
        workspaceName: workspace.name,
        headerColor: workspace.headerColor,
      }));
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
                key={workspace.workspaceName}
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
                onClick={() => {
                  navigate(`/${userName}/${workspace.workspaceName}`);
                  sessionStorage.setItem("workspaceName", workspace.workspaceName);
                }}
              >
                <CardHeader
                  id="workspace-card-header"
                  style={{
                    backgroundColor: workspace.headerColor || "#ddd",
                    color: "white",
                    width: "9vw",
                    height: "9vw",
                    borderRadius: "50%",
                    textAlign: "center",
                    justifyContent: "center",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardTitle style={{ fontSize: "2vw" }}>
                    {workspace.workspaceName.split(" ")[0].charAt(0).toUpperCase() +
                      (workspace.workspaceName.split(" ")[1]
                        ? workspace.workspaceName.split(" ")[1].charAt(0).toUpperCase()
                        : "")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    <h1
                      style={{
                        fontFamily: "sans-serif",
                        textAlign: "center",
                        color: "gray",
                        fontSize: "1rem",
                      }}
                    >
                      {workspace.workspaceName}
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

export default WorkspacesContainer;
