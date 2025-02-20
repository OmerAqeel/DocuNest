import { React, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { use } from "react";
import "../Styles/Workspace.css";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { useDispatch } from "react-redux";
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
import { toast, Toaster } from "sonner";
import AssistantsTable from "@/Components/AssistantsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown } from "lucide-react";
import { CiUser } from "react-icons/ci";
import { Ellipsis } from "lucide-react";
import { Plus } from "lucide-react";
import { IoCheckmarkDone } from "react-icons/io5";
import CreateAssistantModal from "@/Components/CreateAssistantModal";
import WorkspaceFiles from "@/Components/WorkspaceFiles";
import { Upload, Trash } from "lucide-react";

export const Workspace = () => {
  const user = localStorage.getItem("persist:root");
  const parsedUser = JSON.parse(user).userData;
  let JSONparsedUser = JSON.parse(parsedUser);
  const navigate = useNavigate();
  // sessionStorage.setItem("userOnWorkspaceAssistant", false);

  const [membersBtnClicked, setMembersBtnClicked] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [userTab, setUserTab] = useState("");
  const [assistantNewBtnClicked, setAssistantNewBtnClicked] = useState(false);
  const [assistantName, setAssistantName] = useState("");
  const [assistantDescription, setAssistantDescription] = useState("");
  const [filesArray, setFilesArray] = useState([]);
  const [validAssistant, setValidAssistant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [workspaceDocuments, setWorkspaceDocuments] = useState([]);

  const { userName, workspaceName } = useParams();
  const [workspaceData, setWorkspaceData] = useState({});
  const headerColor = workspaceData.workspace?.[0]?.headerColor;
  const ownerOfWorkspace = workspaceData.workspace?.[0]?.owner;
  const assistants = workspaceData.workspace?.[0]?.assistants;

  const fileInputRef = useRef(null);

  const handleUploadWorkspaceDocs = async () => {
    if (workspaceDocuments.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setLoading(true);
    const formData = new FormData();

    // Add files to formData
    workspaceDocuments.forEach((file) => {
      formData.append("files", file);
    });

    // Add workspace_name and user information
    formData.append("workspace_name", workspaceName);
    formData.append("uploaded_by", JSONparsedUser.email);

    try {
      // Call the backend API to upload files
      const response = await axios.post(
        "http://localhost:8000/uploadWorkspaceDoc/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
            // "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Files uploaded successfully!");
      setWorkspaceDocuments([]);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update your handleDocumentUpload function
  const handleDocumentUpload = async (event) => {
    // 1. Grab files from the file input
    const files = Array.from(event.target.files);
    
    // 2. Create form data
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("workspace_name", workspaceName);
    formData.append("uploaded_by", JSONparsedUser.Name);
  
    // 3. Make the API call
    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:8000/uploadWorkspaceDoc/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
            // Leave out "Content-Type"; Axios will set the correct boundary
          },
        }
      );
  
      toast.success("Files uploaded successfully!");
      // Clear the file input if you like:
      event.target.value = "";
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  // Update the handleUploadClick function
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add a button to trigger the upload after files are selected
  // Place this in your JSX where appropriate, for example near the document list
  // const renderUploadButton = () => {
  //   if (workspaceDocuments.length > 0) {
  //     return (
  //       <Button
  //         className="upload-button"
  //         onClick={handleUploadWorkspaceDocs}
  //         disabled={loading}
  //       >
  //         {loading ? "Uploading..." : "Upload Selected Files"}
  //       </Button>
  //     );
  //   }
  //   return null;
  // };

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

  const handleOpenAssistant = (assistantId) => {
    sessionStorage.setItem("userOnWorkspaceAssistant", true);
    sessionStorage.setItem("workspaceColor", headerColor);
    setAssistantLoading(true);
    let conversationID = uuidv4();
    setTimeout(() => {
      setAssistantLoading(false);
    }, 5000);

    navigate(`/chat/${assistantId}/${conversationID}`); // Navigates to /chat/{assistantId}/{conversationID}
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleFileUploadToS3 = async (assistantId) => {
    const formData = new FormData();

    // Add files to formData
    filesArray.forEach((file) => {
      formData.append("files", file); // Append the File objects
    });

    // Add assistant_id, assistant_name, and user_id to formData
    formData.append("assistant_id", assistantId); // Pass the assistant's ID
    formData.append("assistant_name", assistantName); // Pass the assistant's name
    formData.append("user_id", workspaceName); // pass the name of the workspace

    console.log(user.user_id);
    try {
      // Call the backend API to upload files
      const response = await axios.post(
        "http://localhost:8000/upload/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } catch (error) {
      console.error("Error uploading files:", error);
    }
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
      // dispatch(setUserData(updatedUserData));

      // Reset form and close modal
      setAssistantName("");
      setAssistantDescription("");
      setFilesArray([]);
      setAssistantNewBtnClicked(false);

      const updatedWorkspaceData = {
        ...workspaceData,
        workspace: workspaceData.workspace.map((workspace) => ({
          ...workspace,
          assistants: [...workspace.assistants, newAssistant],
        })),
      };

      setWorkspaceData(updatedWorkspaceData);

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

  const handleDeleteAssistant = async (assistantId, assistantName) => {
    setLoading(true);
    setLoadingMessage(`Deleting assistant "${assistantName}"...`);
    try {
      const response = await axios.delete(
        "http://localhost:8000/delete-workspace-assistant/",
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
          data: {
            assistant_id: assistantId,
            workspaceName: workspaceName,
          },
        }
      );

      // Create a deep copy of workspaceData
      const updatedWorkspaceData = {
        ...workspaceData,
        workspace: workspaceData.workspace.map((workspace) => ({
          ...workspace,
          assistants: workspace.assistants.filter((a) => a.id !== assistantId),
        })),
      };

      // Update the workspace data state
      setWorkspaceData(updatedWorkspaceData);

      toast.success(`Assistant "${assistantName}" deleted successfully.`);
    } catch (error) {
      console.error("Error deleting assistant:", error);
      toast.error(
        error.response?.data?.detail ||
          "Failed to delete assistant. Please try again."
      );
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleMemebersButton = () => {
    setMembersBtnClicked(true);

    setWorkspaceMembers(workspaceData.workspace?.[0]?.users);
  };

  useEffect(() => {
    if (
      assistantName.length > 0 &&
      assistantDescription.length > 0 &&
      filesArray.length > 0
    ) {
      setValidAssistant(true);
    } else {
      setValidAssistant(false);
    }
  }, [assistantName, assistantDescription, filesArray]);

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
          <Toaster
            position="bottom-right"
            style={{ backgroundColor: "black", color: "white" }}
          />
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
        ) : userTab === "documents" ? (
          <div className="table-header-container">
            <h1 className="table-title">Workspace Documents</h1>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={handleDocumentUpload} // <-- Use the state updater here
            />

            <Button
              variant="outline"
              style={{
                borderRadius: "10px",
                width: "100px",
                backgroundColor: headerColor,
                color: "white",
              }}
              onClick={handleUploadClick}
            >
              <Plus />
              File
            </Button>
          </div>
        ) : null}
        {assistantNewBtnClicked ? (
          <>
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
          </>
        ) : null}
        {userTab === "assistants" ? (
          <AssistantsTable
            assistants={assistants}
            onOpenAssistant={handleOpenAssistant}
            onDeleteAssistant={handleDeleteAssistant}
            formatDate={formatDate}
            assistantLoading={assistantLoading}
            page={"workspace"}
          />
        ) : userTab === "documents" ? (
          <WorkspaceFiles
            workspaceName={workspaceName}
            // onFileDelete={handleFileDelete}
          />
        ) : null}
      </div>
    </>
  );
};
