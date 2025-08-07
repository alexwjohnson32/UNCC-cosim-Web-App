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
                children: {}
            }
        });
    }

    function removeTransmissionNode(nodeId) {
        const updatedNodes = { ...nodes };
        delete updatedNodes[nodeId];
        setNodes(updatedNodes);
    }

    function addDistributionNode(parent) {
        const node = nodes[parent];
        const newId = `distribution_${v4()}`;
        console.log(nodes);
        node.children[newId] = { name: newId, parent: parent }

        setNodes({ ...nodes, [parent]: node })
    }

    function removeDistributionNode(parentId, nodeId) {
        const updatedNodes = { ...nodes };
        delete updatedNodes[parentId].children[nodeId];
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

    function createDistributionNodeCard(node) {
        return (
            <div className='card' key={node.name}>
                <span className="card-title">GridLab-D</span>
                <span className="card-data"><strong>ID:</strong> {node.name}</span>
                <span className="card-data"><strong>Parent:</strong> {node.parent}</span>
                <div className="icon-container delete" onClick={() => removeDistributionNode(node.parent, node.name)}>
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
                            .flatMap(node => Object.values(node.children))
                            .map(createDistributionNodeCard)}
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