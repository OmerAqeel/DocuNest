// CreateAssistantModal.jsx
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Trash } from "lucide-react";
import { FaRegFilePdf } from "react-icons/fa6";
import { TbFileTypeDocx } from "react-icons/tb";

const CreateAssistantModal = ({
  onClose, // Called when the modal should close (for Cancel and close button)
  onAssistantNameChange, // Called on name input change
  onAssistantDescriptionChange, // Called on description input change
  onFileUpload, // Called when a file is selected
  filesArray, // The current array of uploaded files
  onFileDelete, // Called to delete a selected file
  validAssistant, // Boolean flag to enable/disable the Create button
  onCreateAssistant, // Called when the Create button is clicked
  loading, // Loading flag to show a spinner on the Create button
}) => {
  // Use a ref for the hidden file input
  const fileInputRef = React.useRef(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="modal-overlay">
      <Card className="modal-card">
        <div className="modal-close-btn">
          <Button variant="ghost" size="icon" onClick={onClose}>
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
                onChange={onAssistantNameChange}
              />
            </div>
            <div>
              <div className="labels-container">
                <Label>Description</Label>
              </div>
              <Textarea
                placeholder="Enter assistant description"
                className="mt-2"
                onChange={onAssistantDescriptionChange}
              />
            </div>
            <div className="upload-btn-container">
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                multiple
                style={{ display: "none" }} // Hide input but keep it functional
                onChange={onFileUpload}
              />
              <Button
                variant="outline"
                style={{ borderRadius: "10px", width: "100px" }}
                onClick={handleUploadClick}
              >
                <Upload className="mr-2" />
                Upload
              </Button>
            </div>
          </div>
          <hr style={{ marginTop: "10px" }} />
          <div className="files-container">
            {filesArray.length === 0 ? (
              <p style={{ color: "#9CA3AF", marginTop: "10px" }}>
                No files uploaded
              </p>
            ) : (
              filesArray.map((file, index) => (
                <Alert key={index} variant="outline" className="file-box">
                  <div className="file-detail-container">
                    <AlertDescription>
                      {file.extension === "pdf" ? (
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
                    onClick={() => onFileDelete(file)}
                    style={{
                      onHover: { color: "red", backgroundColor: "red" },
                    }}
                  >
                    <Trash color="red" />
                  </Button>
                </Alert>
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
          <Button className="cancel-btn" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="create-btn"
            disabled={!validAssistant}
            onClick={onCreateAssistant}
          >
            {loading ? (
              <span className="spinner" style={{ borderTopColor: "white" }} />
            ) : (
              "Create"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateAssistantModal;
