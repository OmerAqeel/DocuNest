import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import "../Styles/Dashboard.css";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { IoCheckmarkDone } from "react-icons/io5";
import { MdGroups2 } from "react-icons/md";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setUserData } from "../store/userSlice";
import { toast, Toaster } from "sonner";
import { use } from "react";
import WorkspacesContainer from "./WorkspacesContainer";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import AssistantsTable from "@/Components/AssistantsTable";
import CreateAssistantModal from "@/Components/CreateAssistantModal";

export const Dashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userData);
  const [newBtnClicked, setNewBtnClicked] = useState(false);
  const [assistantName, setAssistantName] = useState("");
  const [assistantDescription, setAssistantDescription] = useState("");
  const [filesArray, setFilesArray] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [validAssistant, setValidAssistant] = useState(false);
  const [hoveredAssistantId, setHoveredAssistantId] = useState(null);
  const [loading, setLoading] = useState(false); // Track loading state
  const [assistantLoading, setAssistantLoading] = useState(false); // Track assistant loading state
  const [loadingMessage, setLoadingMessage] = useState(""); // Dynamic loading message
  const [createBtnClicked, setCreateBtnClicked] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userInDropDown, setUserInDropDown] = useState([]);
  const [value, setValue] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([user.email]);
  const workspaceID = uuidv4();
  const [workspaceCreated, setWorkspaceCreated] = useState(false);

  sessionStorage.setItem("userOnWorkspaceAssistant", false);

  const listOfColors = [
    "#dc2626", // Red
    "#ea580c", // Orange
    "#65a30d", // Green
    "#16a34a", // Emerald
    "#0891b2", // Light green
    "#3b82f6", // Blue
    "#4f46e5", // Light purple
  ];

  let assistants = user.assistants;

  let assistantsLength = assistants.length;

  const handleNewBtnClick = () => {
    setNewBtnClicked(!newBtnClicked);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files); // Directly store file objects
    setFilesArray([...filesArray, ...files]); // Merge with existing files
  };

  const handleFileDelete = (file) => {
    setFilesArray(filesArray.filter((f) => f !== file));
  };

  const handleAssistantNameChange = (e) => {
    setAssistantName(e.target.value);
  };

  const handleAssistantDescriptionChange = (e) => {
    setAssistantDescription(e.target.value);
  };

  const handleOpenAssistant = (assistantId) => {
    sessionStorage.setItem("userOnWorkspaceAssistant", false);
    setAssistantLoading(true);
    let conversationID = uuidv4();
    setTimeout(() => {
      setAssistantLoading(false);
    }, 5000);

    navigate(`/chat/${assistantId}/${conversationID}`); // Navigates to /chat/{assistantId}/{conversationID}
  };

  const handleCreateAssistant = async () => {
    setLoading(true);
    const assistantId = uuidv4(); // Generate a unique ID for the assistant
    const newAssistant = {
      id: assistantId,
      name: assistantName,
      description: assistantDescription,
      files: filesArray,
      lastOpened: new Date().toISOString(), // Set the creation time
    };

    try {
      // Send the new assistant to the backend
      const response = await axios.post(
        "http://localhost:8000/create-assistant",
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

  const handleDeleteAssistant = async (assistantId, assistantName) => {
    setLoading(true);
    setLoadingMessage(`Deleting assistant "${assistantName}"...`);
    try {
      const response = await axios.delete(
        "http://localhost:8000/delete-assistant/",
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
          data: { assistant_id: assistantId }, // Send assistant_id in request body
        }
      );

      console.log(user.user_id);

      // Update Redux state after deletion
      const updatedAssistants = assistants.filter((a) => a.id !== assistantId);
      dispatch(setUserData({ ...user, assistants: updatedAssistants }));

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

  const handleCreateBtnClick = () => {
    setCreateBtnClicked(!createBtnClicked);
  };

  const handleFileUploadToS3 = async (assistantId) => {
    const formData = new FormData();

    // Add files to formData
    filesArray.forEach((file) => {
      formData.append("files", file); // Append the File objects
    });

    // Add assistant_id, assistant_name, and user_id to formData
    formData.append("assistant_id", assistantId); // Pass correct assistantId
    formData.append("assistant_name", assistantName); // Pass the assistant's name
    formData.append("user_id", user.user_id); // Pass user_id from Redux

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

  // const handleSearchChange = (e) => {

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

  const handleCreateWorkspace = async () => {
    if (!workspaceName || !workspaceDescription || selectedUsers.length === 0) {
      toast.error("Please fill out all fields and select at least one user.");
      return;
    }

    setLoading(true);

    let col = listOfColors[Math.floor(Math.random() * listOfColors.length)];
    const newWorkspace = {
      workspace: {
        id: workspaceID,
        name: workspaceName,
        description: workspaceDescription,
        headerColor: col,
      },
      users: selectedUsers,
      owner: user.email,
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/create-workspace",
        newWorkspace,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Handle success (e.g., update UI, show a toast message)
      toast.success(`Workspace "${workspaceName}" created successfully!`);

      // Optionally reset the form
      setWorkspaceName("");
      setWorkspaceDescription("");
      setSelectedUsers([]);
      setCreateBtnClicked(false);
      setWorkspaceCreated(true);

      // Optionally update state with new workspace data
      // Example: dispatch(setWorkspaces(response.data));
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error(
        error.response?.data?.detail ||
          "Failed to create workspace. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/get-all-users",
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
            },
          }
        );

        const users = response.data.map((user) => ({
          value: user.email,
          label: user.name,
        }));

        setUserInDropDown(users);
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
      }
    };

    fetchUsers();
  }, []);

  return (
    <>
      <br />
      <div className="workspaces-container">
        <div className="workspaces-header-container">
          <h1 className="table-title">Your workspaces</h1>
          <Button
            className="button"
            style={{
              borderRadius: "10px",
              width: "100px",
              backgroundColor: "#38bdf8",
            }}
            onClick={handleCreateBtnClick}
          >
            Create
            <MdGroups2 size={20} style={{ marginLeft: "2px" }} />
          </Button>
          {createBtnClicked && (
            <>
              <div className="modal-overlay">
                <Card className="modal-card">
                  <div className="modal-close-btn">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCreateBtnClick}
                    >
                      ✕
                    </Button>
                  </div>
                  <CardHeader>
                    <CardTitle>New Workspace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="modal-content">
                      <div>
                        <div className="labels-container">
                          <Label>Workspace Name</Label>
                        </div>
                        <Input
                          type="text"
                          placeholder="Enter workspace name"
                          className="mt-2"
                          onChange={(e) => setWorkspaceName(e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="labels-container">
                          <Label>Description</Label>
                        </div>
                        <Textarea
                          placeholder="Enter workspace description"
                          className="mt-2"
                          style={{ resize: "none" }}
                          onChange={(e) =>
                            setWorkspaceDescription(e.target.value)
                          }
                        />
                      </div>
                      <div className="users-dropdown-container">
                        <Label>Add Users</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className="w-[200px] justify-between"
                            >
                              Select Users...
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search Users..." />
                              <CommandList>
                                <CommandEmpty>No Users found.</CommandEmpty>
                                <CommandGroup
                                  style={{
                                    maxHeight: "160px",
                                    width: "100%",
                                    overflowY: "auto",
                                  }}
                                >
                                  {userInDropDown.map((Users) => (
                                    <CommandItem
                                      key={Users.value}
                                      value={Users.value}
                                      disabled={Users.value === user.email}
                                      onSelect={(user) => {
                                        if (selectedUsers.includes(user)) {
                                          setSelectedUsers(
                                            selectedUsers.filter(
                                              (u) => u !== user
                                            )
                                          );
                                          return;
                                        }
                                        setSelectedUsers([
                                          ...selectedUsers,
                                          user,
                                        ]);
                                      }}
                                    >
                                      {`${Users.label} (${Users.value})`}
                                      <Check
                                        className={
                                          ("ml-auto",
                                          selectedUsers.includes(Users.value)
                                            ? "opacity-100"
                                            : "opacity-0")
                                        }
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      className="cancel-btn"
                      variant="outline"
                      onClick={handleCreateBtnClick}
                    >
                      Cancel
                    </Button>
                    <Button
                      className={`create-btn`}
                      disabled={
                        !workspaceName ||
                        !workspaceDescription ||
                        selectedUsers.length === 0
                      }
                      onClick={handleCreateWorkspace}
                    >
                      {loading ? (
                        <span
                          className="spinner"
                          style={{ borderTopColor: "white" }}
                        />
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </>
          )}
        </div>
        <div className="workspaces">
          <WorkspacesContainer workspacesCreated={workspaceCreated} />
        </div>
      </div>
      <br />
      <br />
      <Toaster
        position="bottom-right"
        style={{ backgroundColor: "black", color: "white" }}
      />
      <div className="table-header-container">
        <h1 className="table-title">Assistants</h1>
        <Button
          className="button"
          style={{ borderRadius: "10px", width: "100px" }}
          onClick={handleNewBtnClick}
        >
          <Plus />
          New
        </Button>
      </div>
      <hr />
      <AssistantsTable
        assistants={assistants}
        onOpenAssistant={handleOpenAssistant}
        onDeleteAssistant={handleDeleteAssistant}
        assistantLoading={assistantLoading}
        formatDate={formatDate}
        page={"dashboard"}
      />
      {newBtnClicked && (
        <CreateAssistantModal
          onClose={handleNewBtnClick}
          onAssistantNameChange={handleAssistantNameChange}
          onAssistantDescriptionChange={handleAssistantDescriptionChange}
          onFileUpload={handleFileUpload}
          filesArray={filesArray}
          onFileDelete={handleFileDelete}
          validAssistant={validAssistant}
          onCreateAssistant={handleCreateAssistant}
          loading={loading}
        />
      )}
      <br />
      <br />
    </>
  );
};
