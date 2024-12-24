import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import "../Styles/Dashboard.css";
import { v4 as uuidv4 } from "uuid";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { Ellipsis } from "lucide-react";
import { Trash } from "lucide-react";
import { Upload } from "lucide-react";
import { Pencil } from "lucide-react";
import { FaRegFilePdf } from "react-icons/fa6";
import { TbFileTypeDocx } from "react-icons/tb";
import { IoCheckmarkDone } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setUserData } from "../store/userSlice";
import { toast, Toaster } from "sonner";
import { use } from "react";

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
  const [loadingMessage, setLoadingMessage] = useState(""); // Dynamic loading message
  const navigate = useNavigate();

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
    navigate(`/chat/${assistantId}`); // Navigates to /chat/{assistantId}
  };

  const handleCreateAssistant = async () => {
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
    }
  };

  const handleDeleteAssistant = async (assistantId, assistantName) => {
    setLoading(true);
    setLoadingMessage(`Deleting assistant "${assistantName}"...`);
    try {
      const response = await axios.delete("http://localhost:8000/delete-assistant/", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
        },
        data: { assistant_id: assistantId }, // Send assistant_id in request body
      });

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

  return (
    <>
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
      <Table>
        <TableHeader className="DataTable-header">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Last Opened</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="table-body-container">
          {assistantsLength === 0 ? (
            <TableRow>
              <TableCell colSpan="4" className="text-center">
                No assistants created
              </TableCell>
            </TableRow>
          ) : (
            assistants.map((assistant) => (
              <TableRow
                key={assistant.id}
                onMouseEnter={() => setHoveredAssistantId(assistant.id)}
                onMouseLeave={() => setHoveredAssistantId(null)}
              >
                <TableCell>{assistant.name}</TableCell>
                <TableCell>{formatDate(assistant.lastOpened)}</TableCell>
                {hoveredAssistantId === assistant.id ? (
                  <>
                    <TableCell className="open-btn-cell">
                      <Button
                        variant="outline"
                        style={{ borderRadius: "10px", width: "100px" }}
                        onClick={() => handleOpenAssistant(assistant.id)}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </>
                ) : (
                  <TableCell></TableCell>
                )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          style={{ borderRadius: "50%" }}
                        >
                          <Ellipsis />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        onMouseEnter={() => setHoveredAssistantId(null)}
                      >
                        <DropdownMenuItem
                        style= {{
                          cursor: "pointer",
                        }}
                        >
                          <Pencil size={15} />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  marginLeft: "6px",
                                  marginBottom:"2px",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                }}
                              >
                                <Trash size={15} color="red" />
                                 Delete
                              </div>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertTitle>Delete Assistant</AlertTitle>
                              </AlertDialogHeader>
                              <AlertDialogDescription>
                                Are you sure you want to delete this assistant?
                                This action cannot be undone.
                              </AlertDialogDescription>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAssistant(assistant.id, assistant.name)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {newBtnClicked && (
        <div className="modal-overlay">
          <Card className="modal-card">
            <div className="modal-close-btn">
              <Button variant="ghost" size="icon" onClick={handleNewBtnClick}>
                ✕
              </Button>
            </div>
            <CardHeader>
              <CardTitle>Create New Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="modal-content">
                <div>
                  <div className="labels-container">
                    <Label>Name</Label>
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter assistant name"
                    className="mt-2"
                    onChange={handleAssistantNameChange}
                  />
                </div>
                <div>
                  <div className="labels-container">
                    <Label>Description</Label>
                  </div>
                  <Textarea
                    placeholder="Enter assistant description"
                    className="mt-2"
                    onChange={handleAssistantDescriptionChange}
                  />
                </div>
                <div className="upload-btn-container">
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    style={{ display: "none" }} // Hide input but keep it functional
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    style={{ borderRadius: "10px", width: "100px" }}
                    onClick={() =>
                      document.getElementById("file-upload").click()
                    }
                  >
                    <Upload className="mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
              <hr
                style={{
                  marginTop: "10px",
                }}
              />
              <div className="files-container">
                {filesArray.length === 0 ? (
                  <p
                    style={{
                      color: "#9CA3AF",
                      marginTop: "10px",
                    }}
                  >
                    No files uploaded
                  </p>
                ) : (
                  filesArray.map((file, index) => (
                    <>
                      <Alert key={index} variant="outline" className="file-box">
                        <div className="file-detail-container">
                          <AlertDescription>
                            {file.extension == "pdf" ? (
                              <FaRegFilePdf size={20} />
                            ) : (
                              <TbFileTypeDocx size={20} />
                            )}
                          </AlertDescription>
                          <AlertDescription>
                            {file.name.split(".").slice(0, -1).join(".")}
                          </AlertDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFileDelete(file)}
                          style={{
                            onHover: { color: "red", backgroundColor: "red" },
                          }}
                        >
                          <Trash color="red" />
                        </Button>
                      </Alert>
                    </>
                  ))
                )}
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
                onClick={handleNewBtnClick}
              >
                Cancel
              </Button>
              <Button
                className={`create-btn`}
                disabled={!validAssistant}
                onClick={handleCreateAssistant}
              >
                Create
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
};
