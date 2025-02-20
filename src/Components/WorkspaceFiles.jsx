import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Pencil, Trash, Ellipsis } from "lucide-react";
import { FaRegFilePdf } from "react-icons/fa6";
import { TbFileTypeDocx } from "react-icons/tb";
import { toast } from "sonner";
import { Download } from "lucide-react";

const WorkspaceFiles = ({ workspaceName }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredFileId, setHoveredFileId] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [workspaceName]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/getWorkspaceDocuments/?workspace_name=${workspaceName}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );
      setDocuments(response.data.documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch workspace documents");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleFileDownload = (url, filename) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteFile = async (filename) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      await axios.delete(
        "http://localhost:8000/deleteWorkspaceDocument/",
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
          data: {
            workspace_name: workspaceName,
            filename: filename,
          },
        }
      );
      
      toast.success(`File ${filename} deleted successfully`);
      fetchDocuments(); // Refresh the documents list
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FaRegFilePdf size={20} />;
      case 'doc':
      case 'docx':
        return <TbFileTypeDocx size={20} />;
      default:
        return <TbFileTypeDocx size={20} />;
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading documents...</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader className="DataTable-header">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Added By</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="table-body-container">
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan="4" className="text-center">
                No files available
              </TableCell>
            </TableRow>
          ) : (
            documents.map((file, index) => (
              <TableRow
                key={index}
                onMouseEnter={() => setHoveredFileId(index)}
                onMouseLeave={() => setHoveredFileId(null)}
              >
                <TableCell
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {getFileIcon(file.filename)}
                  {file.filename.split(".").slice(0, -1).join(".")}
                </TableCell>
                <TableCell>{file.metadata.uploaded_by}</TableCell>
                {hoveredFileId === index ? (
                  <>
                    <TableCell>
                      <Button
                        variant="outline"
                        style={{
                          borderRadius: "10px",
                          width: "100px",
                          backgroundColor: "#4ade80",
                          color: "white",
                        }}
                        onClick={() => handleFileDownload(file.url, file.filename)}
                      >
                        <Download size={14} /> Download
                      </Button>
                    </TableCell>
                    {fileLoading ? (
                      <TableCell>
                        <span className="spinner" style={{ borderTopColor: "black" }} />
                      </TableCell>
                    ) : null}
                  </>
                ) : (
                  <TableCell></TableCell>
                )}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" style={{ borderRadius: "50%" }}>
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
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
                                marginBottom: "2px",
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
                              <AlertDialogTitle>Delete File</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogDescription>
                              Are you sure you want to delete this file? This action cannot be undone.
                            </AlertDialogDescription>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFile(file.filename)}
                                style={{
                                  backgroundColor: "red",
                                  color: "white",
                                }}
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
    </div>
  );
};

export default WorkspaceFiles;
