import { React, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { use } from "react";
import "../Styles/Workspace.css";
import { Button } from "@/components/ui/button";

export const Workspace = () => {
  const user = localStorage.getItem("persist:root");
  const parsedUser = JSON.parse(user).userData;
  let JSONparsedUser = JSON.parse(parsedUser);

  const { userName, workspaceName } = useParams();
  const [workspaceData, setWorkspaceData] = useState({});
  const headerColor = workspaceData.workspace?.[0]?.headerColor;
  const ownerOfWorkspace = workspaceData.workspace?.[0]?.owner;

  const handleLeaveButton = async () => {
    try {
      await axios.post(
        "http://localhost:8000/leave-workspace",
        {
          email: JSONparsedUser.email,
          workspaceName: workspaceName,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteButton = async () => {
    try {
      await axios.post(
        "http://localhost:8000/delete-workspace",
        {
          email: JSONparsedUser.email,
          workspaceName: workspaceName,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    try {
      axios
        .get(
          `http://localhost:8000/get-workspace-data?workspaceName=${workspaceName}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
            },
          }
        )
        .then((response) => {
          setWorkspaceData(response.data); // Use response.data instead of response
        });
    } catch (error) {
      console.log(error);
    }
  }, []);

  return (
    <div className="above-section">
      <div className="workspace-title-container">
        <div
          className="workspace-title"
          id="workspace-card-header"
          style={{
            backgroundColor: headerColor,
            color: "white",
            width: "9vw",
            height: "9vw",
            borderRadius: "50%",
            textAlign: "center",
            justifyContent: "center",
            display: "flex",
            flexDirection: "column",
            marginTop: "2rem",
          }}
        >
          <h1 style={{ fontSize: "2rem" }}>
            {workspaceName.split(" ")[0].charAt(0).toUpperCase() +
              (workspaceName.split(" ")[1]
                ? workspaceName.split(" ")[1].charAt(0).toUpperCase()
                : "")}
          </h1>
        </div>
        <div className="workspace-title-disc-container">
          <h1 className="workspace-title">{workspaceName}</h1>
          <p>{workspaceData.workspace?.[0]?.description}</p>
        </div>
      </div>
      <div className="toolsbar-container">
        {ownerOfWorkspace !== JSONparsedUser.email ? (
          <>
          <Button className="leave-button">Leave</Button>
          </>
        ) :
        <>
        <Button className="members-button"
        variant="outline"
        >Members</Button>
        <Button className="delete-button">Delete Workspace</Button>
        </>
        }
      </div>
      <hr />
    </div>
  );
};
