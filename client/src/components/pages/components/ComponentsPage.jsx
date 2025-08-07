import { Plug2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { v4 } from "uuid";
import Page from "../Page";
import "./Components.css";

export default function ComponentsPage() {
    /* We are going to need a page with the ability to select number of GridPack and GridLab instance */
    /* We should start with one GridPack but it should eventually be able to connect multiple */
    /* We need a button to be able to generate the JSON files */
    /* We will need a button to kick off the sim */
    const [nodes, setNodes] = useState({});

    function createTransmissionNode() {
        const newId = `transmission_${v4()}`;
        setNodes({
            ...nodes,
            [newId]: {
                name: newId,
                children: []
            }
        });
    }

    function removeTransmissionNode(nodeId) {
        const updatedNodes = { ...nodes };
        delete updatedNodes[nodeId];
        setNodes(updatedNodes);
    }

    function addDistributionNode(parent) {
        const newId = `distribution_${v4()}`;
        const parentNode = nodes[parent];

        const updatedParent = {
            ...parentNode,
            children: [...parentNode.children, newId]
        };

        setNodes({
            ...nodes,
            [parent]: updatedParent
        })
    }

    function removeDistributionNode(nodeId) {
        const updatedNodes = { ...nodes };

        for (const [key, node] of Object.entries(updatedNodes)) {
            if (node.children.includes(nodeId)) {
                updatedNodes[key] = {
                    ...node,
                    children: node.children.filter(id => id !== nodeId)
                };
                break;
            }
        }

        setNodes(updatedNodes);
    }

    function createTransmissionNodeCard(node) {
        return (
            <div className='card' key={node.name}>
                <span className="card-title">GridPack</span>
                <span className="card-data"><strong>ID:</strong> {node.name}</span>
                <span className="card-data"><strong>Child Nodes:</strong> {Object.keys(node.children).length}</span>
                <button className="rotating-button" onClick={() => addDistributionNode(node.name)}>
                    <div className="icon-container">
                        <Plug2 className="icon icon-plug" />
                        <Plus className="icon icon-plus" />
                    </div>
                </button>
                <div className="icon-container delete" onClick={() => removeTransmissionNode(node.name)}>
                    <Trash2 fill="red" className="icon delete-icon" />
                </div>
            </div>
        )
    }

    function createDistributionNodeCard(distId) {
        const parentId = Object.entries(nodes).find(([_, node]) =>
            node.children.includes(distId)
        )[0];

        return (
            <div className='card' key={distId}>
                <span className="card-title">GridLab-D</span>
                <span className="card-data"><strong>ID:</strong> {distId}</span>
                <span className="card-data"><strong>Parent:</strong> {parentId}</span>
                <div className="icon-container delete" onClick={() => removeDistributionNode(distId)}>
                    <Trash2 fill="red" className="icon delete-icon" />
                </div>
            </div>
        )
    }

    return (
        <Page metadata={'Components'}>
            <div className="components-container">
                <div className="node-list">
                    <div className="node-list-header">
                        <span>Transmission Nodes</span>
                        <button onClick={() => createTransmissionNode()}>Add Node<Plus /></button>
                    </div>
                    <div className="node-list-items">
                        {Object.values(nodes).map(node => createTransmissionNodeCard(node))}
                    </div>
                </div>
                <div className="node-list">
                    <div className="node-list-header">
                        <span>Distribution Nodes</span>
                    </div>
                    <div className="node-list-items">
                        {Object.values(nodes)
                            .flatMap(node => node.children)
                            .map(id => createDistributionNodeCard(id))}
                    </div>
                </div>
            </div>
            {Object.keys(nodes).length > 0 &&
                <button className="primary align-right">
                    Build Configuration
                </button>
            }

        </Page>
    )
}