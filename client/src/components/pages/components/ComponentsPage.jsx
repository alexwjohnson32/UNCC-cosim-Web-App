import {
    Box,
    ChevronDown,
    ChevronRight,
    Copy,
    Edit,
    Plus,
    Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Page from "../Page";
import { fetchJSON } from "../../../utils/RESTUtils";

/**
 * This page is for Component management. Components are reusable configurations
 * of distribution systems, transmission systems, and other components.
 */
export default function ComponentsPage() {
    const [components, setComponents] = useState({});
    const [expandedComponent, setExpandedComponent] = useState("");

    useEffect(() => {
        loadComponents();
    }, []);

    async function loadComponents() {
        try {
            const { components } = await fetchJSON("/api/components");
            setComponents(components);
        } catch (err) {
            console.error("Error loading components:", err);
        }
    }

    const componentList = useMemo(() => Object.values(components), [components]);

    const totalComponents = componentList.length;
    const totalDistributionNodes = componentList.reduce(
        (sum, comp) => sum + comp.distNodes.length,
        0
    );
    const totalNestedComponents = componentList.reduce(
        (sum, comp) => sum + comp.subComponents.length,
        0
    );

    const sectionHeader = (label) => (
        <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 whitespace-nowrap">
                {label}
            </span>
            <div className="h-px flex-1 bg-black/10" />
        </div>
    );

    const cardClass = "rounded-md border border-black/10 bg-white";
    const labelClass = "text-[11px] font-medium text-gray-600";
    const iconButtonClass =
        "flex h-8 w-8 items-center justify-center rounded-sm border border-black/10 bg-white text-gray-500 transition hover:bg-black/5 cursor-pointer";
    const badgeClass =
        "rounded-sm border border-black/15 px-2 py-[2px] text-[10px] font-medium text-gray-600";
    const nestedBadgeClass =
        "rounded-sm border border-black/15 bg-black/5 px-2 py-[2px] text-[10px] font-medium text-gray-700";

    function createComponentCard(component) {
        const { name, date, rootNode, distNodes, subComponents } = component;
        const isExpanded = expandedComponent === name;

        return (
            <div key={name} className="flex flex-col">
                <div
                    id={name}
                    className={`flex w-full items-center justify-between rounded-t-md border border-black/10 bg-white px-3 py-3 cursor-pointer ${!isExpanded ? "rounded-b-md" : ""
                        }`}
                    onClick={() =>
                        setExpandedComponent(isExpanded ? "" : name)
                    }
                >
                    <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                            <ChevronDown size={17} className="text-gray-500 shrink-0" />
                        ) : (
                            <ChevronRight size={17} className="text-gray-500 shrink-0" />
                        )}

                        <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">
                                    {name}
                                </span>
                                <span className={badgeClass}>{date}</span>
                                {subComponents.length > 0 && (
                                    <span className={nestedBadgeClass}>Nested</span>
                                )}
                            </div>

                            <span className="text-xs text-gray-500 truncate">
                                {rootNode.model} transmission system with{" "}
                                {distNodes.length > 1
                                    ? `${distNodes.length} distribution feeders`
                                    : `a ${distNodes[0].model} distribution system`}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            className={iconButtonClass}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <Copy size={16} />
                        </button>
                        <button
                            className={iconButtonClass}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            className={iconButtonClass}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="flex flex-col gap-4 rounded-b-md border border-t-0 border-black/10 bg-white px-3 py-4">
                        {sectionHeader("Root Node (Transmission)")}

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                            <div className="xl:col-span-4 flex flex-col gap-1">
                                <div className="flex items-center justify-between rounded-sm border border-black/10 bg-corvid-primary/5 px-3 py-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-gray-900">
                                            {rootNode.model}
                                        </span>
                                    </div>
                                    <span className="rounded-sm border border-corvid-primary/25 bg-corvid-primary/5 px-2 py-1 text-[10px] font-medium text-gray-700">
                                        {rootNode.system}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {sectionHeader(`Distribution Nodes (${distNodes.length})`)}

                        <div className="flex flex-col gap-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                                {distNodes.map((node, index) =>
                                    createDistSection(node, `${name}-dist-${index}`)
                                )}
                            </div>
                        </div>

                        {subComponents.length > 0 && (
                            <>
                                {sectionHeader(`Sub Components (${subComponents.length})`)}

                                <div className="flex flex-col gap-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {subComponents.map((sub, index) =>
                                            createComponentSection(
                                                components[sub],
                                                `${name}-sub-${index}`
                                            )
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }

    function createDistSection(node, key) {
        return (
            <div
                key={key}
                className="flex items-center justify-between rounded-sm border border-black/10 bg-[#12AE1F]/5 px-3 py-2"
            >
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-gray-900">
                        {node.model}
                    </span>
                    <span className="text-[11px] text-gray-500">
                        Bus ID: {node.bus_id}
                    </span>
                </div>

                <span className="rounded-sm border border-[#12AE1F]/25 bg-[#12AE1F]/5 px-2 py-1 text-[10px] font-medium text-gray-700 shrink-0">
                    {node.system}
                </span>
            </div>
        );
    }

    function createComponentSection(sub, key) {
        if (!sub) return null;

        return (
            <div
                key={key}
                className="flex items-center justify-between rounded-sm border border-black/10 bg-[#D93229]/5 px-3 py-2"
            >
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-gray-900">
                        {sub.name}
                    </span>
                    <span className="text-[11px] text-gray-500">
                        {sub.rootNode.model} transmission system with{" "}
                        {sub.distNodes.length > 1
                            ? `${sub.distNodes.length} distribution feeders`
                            : `a ${sub.distNodes[0].model} distribution system`}
                    </span>
                </div>

                <span className="rounded-sm border border-[#D93229]/25 bg-[#D93229]/5 px-2 py-1 text-[10px] font-medium text-gray-700 shrink-0">
                    Component
                </span>
            </div>
        );
    }

    return (
        <Page metadata={"Component Builder"}>
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
                {/* Header / Metadata */}
                <div className={`px-4 py-3`}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <Box size={16} className="stroke-gray-500" />
                                <span className="text-base font-semibold text-gray-900">
                                    Component Library
                                </span>
                            </div>
                            <span className="text-sm text-gray-500">
                                Create reusable grid components with transmission root
                                nodes and distribution branches
                            </span>
                        </div>

                        <button className="flex h-9 items-center gap-1.5 rounded-sm bg-corvid-primary px-3 text-sm font-semibold text-white cursor-pointer active:brightness-95">
                            <Plus strokeWidth={3} size={16} />
                            New Component
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-black/10 pt-4">
                        <div className="flex flex-col items-center justify-center gap-1 rounded-sm border border-black/5 bg-black/[0.015] py-3">
                            <span className="text-2xl font-bold text-blue-600">
                                {totalComponents}
                            </span>
                            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500">
                                Total Components
                            </span>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-1 rounded-sm border border-black/5 bg-black/[0.015] py-3">
                            <span className="text-2xl font-bold text-green-600">
                                {totalDistributionNodes}
                            </span>
                            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500">
                                Distribution Nodes
                            </span>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-1 rounded-sm border border-black/5 bg-black/[0.015] py-3">
                            <span className="text-2xl font-bold text-orange-600">
                                {totalNestedComponents}
                            </span>
                            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500">
                                Nested Components
                            </span>
                        </div>
                    </div>
                </div>

                {/* Library List */}
                <div className={`${cardClass} flex min-h-0 flex-1 flex-col px-4 py-4`}>
                    <div className="flex flex-col shrink-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base font-semibold text-gray-900">
                                Component Library
                            </span>
                            <span className="text-sm text-gray-500">
                                ({totalComponents})
                            </span>
                        </div>
                        <span className="text-sm text-gray-500">
                            Click a component to expand and view details
                        </span>
                    </div>

                    <div className="mt-4 flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto">
                        {componentList.map((comp) => createComponentCard(comp))}
                    </div>
                </div>
            </div>
        </Page>
    );
}