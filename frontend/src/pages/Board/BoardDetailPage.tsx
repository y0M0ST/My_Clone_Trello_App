import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";

import type {
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    DropAnimation,
} from "@dnd-kit/core";

import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { ListColumn } from "@/features/board/components/ListColumn";
import { CardItem } from "@/features/board/components/CardItem";

import { cardApi } from "@/shared/api/card.api";
import { boardApi } from "@/shared/api/board.api";

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: { opacity: "0.5" },
        },
    }),
};

export default function BoardDetailPage() {
    const { boardId } = useParams();
    const [columns, setColumns] = useState<any[]>([]);
    const [activeDragItem, setActiveDragItem] = useState<any>(null);
    const dragMetaRef = useRef<{ columnId: string; index: number } | null>(null);

    const fetchBoard = async () => {
        if (!boardId) return;
        try {
            const res: any = await boardApi.getDetail(boardId);
            if (res && res.data) {
                const boardData = res.data || res.responseObject;
                setColumns(boardData.lists || []);
            }
        } catch (error) {
            console.error("Failed to fetch board:", error);
        }
    };

    useEffect(() => {
        fetchBoard();
    }, [boardId]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    const findColumn = (cols: any[], uniqueId: string) => {
        if (!uniqueId) return null;
        if (cols.some((c) => c.id === uniqueId)) {
            return cols.find((c) => c.id === uniqueId);
        }
        return cols.find((c) => c.cards?.some((card: any) => card.id === uniqueId));
    };
    const handleDragStart = (event: DragStartEvent) => {
        const activeId = event.active.id as string;
        const column = findColumn(columns, activeId);
        const index = column?.cards?.findIndex((c: any) => c.id === activeId) ?? -1;

        if (column && index >= 0) {
            dragMetaRef.current = { columnId: column.id, index };
        } else {
            dragMetaRef.current = null;
        }

        setActiveDragItem(event.active.data.current);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        setColumns((prev) => {
            const activeColumn = findColumn(prev, activeId as string);
            const overColumn = findColumn(prev, overId as string);

            if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
                return prev;
            }

            const activeItems = activeColumn.cards || [];
            const overItems = overColumn.cards || [];
            const activeIndex = activeItems.findIndex((i: any) => i.id === activeId);
            const overIndex = overItems.findIndex((i: any) => i.id === overId);
            const isOverColumn = prev.some((col) => col.id === overId);

            if (activeIndex < 0) return prev;

            let newIndex = overItems.length;
            if (!isOverColumn && overIndex >= 0) {
                const isBelowOverItem =
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;
                newIndex = overIndex + (isBelowOverItem ? 1 : 0);
            }

            const movingCard = activeItems[activeIndex];

            return prev.map((c) => {
                if (c.id === activeColumn.id) {
                    return {
                        ...c,
                        cards: activeItems.filter((item: any) => item.id !== activeId),
                    };
                }
                if (c.id === overColumn.id) {
                    const nextCards = overItems.filter((item: any) => item.id !== activeId);
                    return {
                        ...c,
                        cards: [
                            ...nextCards.slice(0, newIndex),
                            movingCard,
                            ...nextCards.slice(newIndex),
                        ],
                    };
                }
                return c;
            });
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        const itemData = activeDragItem;
        const dragMeta = dragMetaRef.current;
        dragMetaRef.current = null;

        setActiveDragItem(null);

        if (!over || !dragMeta) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const overColumn = findColumn(columns, overId);

        if (!overColumn) return;

        const prevColumnId = dragMeta.columnId;
        const prevIndex = dragMeta.index;
        const nextColumnId = overColumn.id;

        if (prevIndex < 0) return;

        let nextIndex = 0;

        if (prevColumnId === nextColumnId) {
            const currentCards = overColumn.cards || [];
            const oldIndex = currentCards.findIndex((c: any) => c.id === activeId);
            const rawNewIndex = currentCards.findIndex((c: any) => c.id === overId);
            const newIndex = rawNewIndex >= 0 ? rawNewIndex : Math.max(currentCards.length - 1, 0);

            if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

            nextIndex = newIndex;

            setColumns((prev) =>
                prev.map((col) => {
                    if (col.id === nextColumnId) {
                        return {
                            ...col,
                            cards: arrayMove(col.cards, oldIndex, newIndex),
                        };
                    }
                    return col;
                })
            );
        } else if (itemData) {
            const currentCards = overColumn.cards || [];
            const uiIndex = currentCards.findIndex((c: any) => c.id === activeId);
            const fallbackCards = currentCards.filter((c: any) => c.id !== activeId);
            const fallbackIndex = fallbackCards.findIndex((c: any) => c.id === overId);
            nextIndex = uiIndex >= 0 ? uiIndex : (fallbackIndex >= 0 ? fallbackIndex : fallbackCards.length);

            setColumns((prev) =>
                prev.map((col) => {
                    if (col.id === prevColumnId) {
                        return {
                            ...col,
                            cards: (col.cards || []).filter((c: any) => c.id !== activeId),
                        };
                    }
                    if (col.id === nextColumnId) {
                        const cleaned = (col.cards || []).filter((c: any) => c.id !== activeId);
                        return {
                            ...col,
                            cards: [
                                ...cleaned.slice(0, nextIndex),
                                itemData,
                                ...cleaned.slice(nextIndex),
                            ],
                        };
                    }
                    return col;
                })
            );
        }

        try {
            if (itemData) {
                const fallbackCards = (overColumn.cards || []).filter((c: any) => c.id !== activeId);
                const fallbackIndex = fallbackCards.findIndex((c: any) => c.id === overId);
                const apiNextIndex =
                    prevColumnId === nextColumnId
                        ? nextIndex
                        : (nextIndex >= 0 ? nextIndex : (fallbackIndex >= 0 ? fallbackIndex : fallbackCards.length));

                await cardApi.moveCard({
                    cardId: activeId,
                    prevColumnId,
                    prevIndex,
                    nextColumnId,
                    nextIndex: apiNextIndex < 0 ? 0 : apiNextIndex,
                });
                console.log(`Moved: ${prevColumnId} -> ${nextColumnId}`);
            }
        } catch (error) {
            console.error("Move failed:", error);
            fetchBoard(); 
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full w-full gap-4 overflow-x-auto p-4 bg-blue-600/10 items-start">
                {columns.map((col) => (
                    <ListColumn key={col.id} list={col} onReload={fetchBoard} />
                ))}
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeDragItem ? (
                    <CardItem card={activeDragItem} onReload={() => { }} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
