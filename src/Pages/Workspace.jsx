import { React, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { use } from "react";
import "../Styles/Workspace.css";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import AssistantsTable from "@/Components/AssistantsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown } from "lucide-react";
import { CiUser } from "react-icons/ci";
import { Ellipsis } from "lucide-react";
import { Plus } from "lucide-react";
import CreateAssistantModal from "@/Components/CreateAssistantModal";

export const Workspace = () => {
  const user = localStorage.getItem("persist:root");
  const parsedUser = JSON.parse(user).userData;
  let JSONparsedUser = JSON.parse(parsedUser);

  const [membersBtnClicked, setMembersBtnClicked] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [userTab, setUserTab] = useState("");
  const [assistantNewBtnClicked, setAssistantNewBtnClicked] = useState(false);
  const [assistantName, setAssistantName] = useState("");
  const [assistantDescription, setAssistantDescription] = useState("");
  const [filesArray, setFilesArray] = useState([]);
  const [validAssistant, setValidAssistant] = useState(false);
  const [loading, setLoading] = useState(false);

  const { userName, workspaceName } = useParams();
  const [workspaceData, setWorkspaceData] = useState({});
  const headerColor = workspaceData.workspace?.[0]?.headerColor;
  const ownerOfWorkspace = workspaceData.workspace?.[0]?.owner;

  const handleAssistantNewBtnClick = () => {
    setAssistantNewBtnClicked(false);
  };

  const handleAssistantNameChange = (e) => {
    setAssistantName(e.target.value);
  };

  const handleAssistantDescriptionChange = (e) => {
    setAssistantDescription(e.target.value);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files); // Directly store file objects
    setFilesArray([...filesArray, ...files]); // Merge with existing files
  };

  const handleFileDelete = (file) => {
    setFilesArray(filesArray.filter((f) => f !== file));
  };

  const handleCreateAssistant = async () => {
    setLoading(true);
    const assistantId = uuidv4(); // Generate a unique ID for the assistant
    const newAssistant = {
      id: assistantId,
      name: assistantName,
      workspaceName: workspaceName,
      description: assistantDescription,
      files: filesArray,
      createdBy: JSONparsedUser.Name,
      lastOpened: new Date().toISOString(), // Set the creation time
    };

    try {
      // Send the new assistant to the backend
      const response = await axios.post(
        "http://localhost:8000/create-workspace-assistant",
        newAssistant,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );
      // Upload files to S3
      await handleFileUploadToS3(assistantId);

      // Get the updated user data from the response
      const updatedUserData = response.data;

      // Update Redux state with the new assistant
      dispatch(setUserData(updatedUserData));

      // Reset form and close modal
      setAssistantName("");
      setAssistantDescription("");
      setFilesArray([]);
      setNewBtnClicked(false);

      // Display success message
      toast.success(`Assistant "${assistantName}" created successfully!`, {
        icon: <IoCheckmarkDone style={{ color: "white" }} size={20} />,
        className: "custom-toast",
      });
    } catch (error) {
      console.error("Error creating assistant:", error);

      // Display user-friendly error message
      alert(
        error.response?.data?.detail ||
          "Failed to create assistant. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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

  const handleMemebersButton = () => {
    setMembersBtnClicked(true);

    setWorkspaceMembers(workspaceData.workspace?.[0]?.users);
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
    <>
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
            <p className="workspace-description">
              {workspaceData.workspace?.[0]?.description}
            </p>
          </div>
        </div>
        <div className="toolsbar-container">
          {ownerOfWorkspace !== JSONparsedUser.email ? (
            <>
              <Button className="leave-button">Leave</Button>
            </>
          ) : (
            <>
              <Button
                className="members-button"
                variant="outline"
                onClick={handleMemebersButton}
              >
                Members
              </Button>
              <Button className="delete-button">Delete Workspace</Button>
            </>
          )}
          {membersBtnClicked ? (
            <>
              <div className="modal-overlay">
                <Card className="modal-card">
                  <div className="modal-close-btn">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMembersBtnClicked(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  <CardHeader>
                    <CardTitle>Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {workspaceMembers.map((member) => {
                      return (
                        <>
                          <div
                            className="member-card"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "1rem",
                              borderRadius: "0.5rem",
                              backgroundColor: "#f2f2f2",
                              marginBottom: "1rem",
                            }}
                          >
                            <div className="member-card-header">
                              <div
                                className="member-card-header-content"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "50px",
                                }}
                              >
                                {/* <h1>{member.name}</h1> */}
                                <p
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <CiUser size={24} />
                                  {member}
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })}
                  </CardContent>
                  <CardFooter
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  ></CardFooter>
                </Card>
              </div>
            </>
          ) : null}
        </div>
        <div className="workspace-content">
          <Tabs
            style={{
              // padding: "10px",
              display: "flex",
              left: "0",
            }}
          >
            <TabsList
              style={{
                width: "40vw",
                gap: "3px",
                backgroundColor: "white",
              }}
            >
              <TabsTrigger
                value="assistants"
                style={{
                  padding: "10px",
                  width: "20vw",
                  backgroundColor:
                    userTab === "assistants" ? headerColor : "white",
                  color: userTab === "assistants" ? "white" : "black",
                  border: "1px solid #ddd",
                  borderRadius: "10px 0 0 0",
                }}
                onClick={() => setUserTab("assistants")}
              >
                Assistants
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                onClick={() => setUserTab("documents")}
                style={{
                  padding: "10px",
                  width: "20vw",
                  backgroundColor:
                    userTab === "documents" ? headerColor : "white",
                  color: userTab === "documents" ? "white" : "black",
                  border: "1px solid #ddd",
                  borderRadius: "10px 0 0 0",
                }}
              >
                Documents
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <hr />
        </div>
      </div>
      <div className="below-section">
        <br />
        {userTab === "assistants" ? (
          <div className="table-header-container">
            <h1 className="table-title">Workspace Assistants</h1>
            <Button
              className="button"
              style={{
                borderRadius: "10px",
                width: "100px",
                backgroundColor: headerColor,
                color: "white",
              }}
              onClick={() => setAssistantNewBtnClicked(true)}
            >
              <Plus />
              New
            </Button>
          </div>
        ) : null}
        {assistantNewBtnClicked ? (
          <CreateAssistantModal
            onClose={handleAssistantNewBtnClick}
            onAssistantNameChange={handleAssistantNameChange}
            onAssistantDescriptionChange={handleAssistantDescriptionChange}
            onFileUpload={handleFileUpload}
            filesArray={filesArray}
            onFileDelete={handleFileDelete}
            validAssistant={validAssistant}
            onCreateAssistant={handleCreateAssistant}
            loading={loading}
          />
        ) : null}
      </div>
    </>
  );
};
