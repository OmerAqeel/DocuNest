import {React, useState, useEffect} from 'react'
import axios from 'axios'

export const Workspaces = (workspaces) => {
    const [workspacesList, setWorkspacesList] = useState([]);

    const user = localStorage.getItem("persist:root");

    const parsedUser = JSON.parse(user).userData;

    let JSONparsedUser = JSON.parse(parsedUser);

    const userEmail = JSONparsedUser?.email;

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
            const workspaceNames = response.data.workspaces.map(workspace => workspace.name);
            setWorkspacesList(workspaceNames);
          } catch (error) {
            console.error("Error fetching workspaces:", error);
          }
        };
        fetchWorkspaces();
    }
    , []);


  return (
    <>
    <div className='workspaces-cards'>
    {
        workspacesList.length === 0 ? (
            <h1
                style={{textAlign: 'center',
                    color: 'gray',
                }}
            >You have no workspaces</h1>
        ) : (
            workspacesList.map(workspace => (
                <div className='workspace-card'>
                    <h1>{workspace}</h1>
                </div>
            ))
        )
    }
    </div>
    </>
  )
}

export default Workspaces
