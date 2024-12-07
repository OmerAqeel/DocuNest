import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import "../Styles/Dashboard.css";
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react";
import { Ellipsis } from "lucide-react";
import { FileUp } from 'lucide-react';
import { Upload } from 'lucide-react';
import { useSelector } from "react-redux";

export const Dashboard = () => {
  const user = useSelector((state) => state.user.userData);

  const [newBtnClicked, setNewBtnClicked] = useState(false);

  let assistants = user.assistants;

  let assistantsLength = assistants.length;

  const handleNewBtnClick = () => {
    if(newBtnClicked) {
      setNewBtnClicked(false);
    }
    else {
      setNewBtnClicked(true); 
    }
  }
  return (
    <>
      <br />
      <br />
      <div className="table-header-container">
        <h1 className="table-title">Assistants</h1>
        <Button
          className="button"
          style={{ "border-radius": "10px",
            "width": "100px",
           }}
          variant="outline"
          onClick={handleNewBtnClick}
        >
          <Plus />New
        </Button>
      </div>
      <hr />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Last Opened</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            {assistantsLength === 0 && (
              <TableCell colSpan="4" className="text-center">
                No assistants found
              </TableCell>
            )}
            {assistants.map((assistant) => (
              <>
                <TableCell>{assistant.id}</TableCell>
                <TableCell>{assistant.name}</TableCell>
                <TableCell>{assistant.lastOpened}</TableCell>
                <TableCell className="text-right">
                  <Ellipsis />
                </TableCell>
              </>
            ))}
          </TableRow>
        </TableBody>
      </Table>
      {newBtnClicked && (
        <div className="modal-overlay">
          <Card className="modal-card">
            <div className="modal-close-btn">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNewBtnClick}
              >
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
                  />
                </div>
                <div>
                  <div className="labels-container">
                  <Label>Description</Label>
                  </div>
                  <Textarea
                    placeholder="Enter assistant description"
                    className="mt-2"
                  />
                </div>
                <br />
                <div className="upload-btn-container">
                  <Button
                    className="upload-btn"
                    style={{ "border-radius": "10px",
                      "width": "100px",
                    }}
                    variant="outline"
                  >
                    <Upload />Upload
                  </Button>
                </div>
              </div>
              <hr style={{
                "marginTop": "10px",
              }}/>
              <div className="files-container">
                <p style={
                  {
                    "color": "#9CA3AF",
                    "marginTop": "10px",
                  }
                }>No files uploaded</p>
              </div>
            </CardContent>
            <CardFooter
            style={{
              "display": "flex",
              "justifyContent": "space-between",
              "alignItems": "center",
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
                className="create-btn"
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