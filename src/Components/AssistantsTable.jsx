import React, { useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

const AssistantsTable = ({
  assistants,
  onOpenAssistant,
  onDeleteAssistant,
  assistantLoading,
  formatDate,
  page,
}) => {
  // Local state for managing which assistant is hovered.
  const [hoveredAssistantId, setHoveredAssistantId] = useState(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  // Open Sheet & Load Assistant Data
  const handleEditClick = (assistant) => {
    setSelectedAssistant(assistant);
    setEditedName(assistant.name);
    setEditedDescription(assistant.description || ""); // Default if empty
    setOpenSheet(true);
  };

  // Update Assistant API Call
  const handleUpdateAssistant = async () => {
    try {
      await axios.put(
        "http://localhost:8000/update-assistant", // Adjust API endpoint
        {
          id: selectedAssistant.id,
          name: editedName,
          description: editedDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
          },
        }
      );
      setOpenSheet(false);
      alert("Assistant updated successfully!"); // Replace with toast if needed
    } catch (error) {
      console.error("Error updating assistant:", error);
      alert("Failed to update assistant.");
    }
  };


  return (
    <>
    <Table
    >
      <TableHeader className="DataTable-header">
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Last Opened</TableHead>
          {
            page === "workspace" ? (
              <TableHead>Created By</TableHead>
            ) : null
          }
        </TableRow>
      </TableHeader>
      <TableBody className="table-body-container">
        {assistants.length === 0 ? (
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
              {
                page === "workspace" ? (
                  <TableCell>{assistant.createdBy}</TableCell>
                ) : null
              }
              {hoveredAssistantId === assistant.id ? (
                <>
                  <TableCell className="open-btn-cell">
                    <Button
                      variant="outline"
                      style={{
                        borderRadius: "10px",
                        width: "100px",
                        backgroundColor: "#4ade80",
                        color: "white",
                      }}
                      onClick={() => onOpenAssistant(assistant.id)}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "white";
                        e.target.style.color = "#4ade80";
                        e.target.style.borderColor = "#4ade80";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#4ade80";
                        e.target.style.color = "white";
                        e.target.style.borderColor = "#4ade80";
                      }}
                    >
                      Open
                    </Button>
                  </TableCell>
                  {assistantLoading ? (
                    <TableCell>
                      <span
                        className="spinner"
                        style={{ borderTopColor: "black" }}
                      />
                    </TableCell>
                  ) : null}
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
                      style={{
                        cursor: "pointer",
                      }}
                      onClick={() => handleEditClick(assistant)}
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
                            <AlertDialogTitle>Delete Assistant</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogDescription>
                            Are you sure you want to delete this assistant? This action cannot be undone.
                          </AlertDialogDescription>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                onDeleteAssistant(assistant.id, assistant.name)
                              }
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

{/* 🔹 Sheet for Editing Assistant */}
<Sheet open={openSheet} onOpenChange={setOpenSheet}>
<SheetContent>
  <SheetHeader>
    <SheetTitle>Edit Assistant</SheetTitle>
    <SheetDescription>
      Modify the details of your assistant.
    </SheetDescription>
  </SheetHeader>
  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
    <Label>Name</Label>
    <Input
      type="text"
      value={editedName}
      onChange={(e) => setEditedName(e.target.value)}
      placeholder="Enter assistant name"
    />
    <Label>Description</Label>
    <Textarea
      value={editedDescription}
      onChange={(e) => setEditedDescription(e.target.value)}
      placeholder="Enter assistant description"
    />
    <Button
      onClick={handleUpdateAssistant}
      style={{ marginTop: "12px", backgroundColor: "#4ade80", color: "white" }}
    >
      Save Changes
    </Button>
  </div>
</SheetContent>
</Sheet>
</>
  );
};

export default AssistantsTable;
