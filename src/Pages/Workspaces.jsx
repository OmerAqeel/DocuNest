import {React, useState} from 'react'

export const Workspaces = (workspaces) => {
    const [workspacesList, setWorkspacesList] = useState([]);

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
                    <h1>{workspaceList.name}</h1>
                    <p>{workspaceList.description}</p>
                </div>
            ))
        )
    }
    </div>
    </>
  )
}

export default Workspaces
