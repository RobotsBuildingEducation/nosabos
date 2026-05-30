// components/dnd/Sortable.jsx
//
// Thin dnd-kit wrapper that emulates the slice of the @hello-pangea/dnd API this
// app relies on, but with proper support for wrapping (multi-line) lists.
//
// Why: @hello-pangea/dnd (react-beautiful-dnd) only supports single-axis lists.
// A flex-wrapped word bank / answer row reorders incorrectly once items spill
// onto a second line (drops snap to the start or end of the list). dnd-kit's
// sortable with rectSortingStrategy is built for 2D / wrapping layouts.
//
// The existing drag handlers all speak the react-beautiful-dnd result shape:
//   { source: { droppableId, index }, destination: { droppableId, index } | null, draggableId }
// SortableArea adapts dnd-kit's onDragEnd back into that shape, so those handlers
// (handleDragEnd, handleMcDragEnd, handleMaDragEnd, match onDragEnd, the tap
// auto-move helpers, ...) are reused unchanged.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Flex } from "@chakra-ui/react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const RegistryContext = createContext(null);
const ContainerContext = createContext(null);

/**
 * SortableArea — replaces <DragDropContext>.
 *
 * Keeps a live registry of every SortableList's ordered item ids, then on drop
 * resolves the active/over ids into the react-beautiful-dnd result shape and
 * forwards it to `onDragEnd` (which is the project's existing handler verbatim).
 */
export function SortableArea({ onDragEnd, onDragStart, children }) {
  // containerId -> ordered array of item ids (kept current by each SortableList)
  const registryRef = useRef(new Map());
  // itemId -> render function
  const itemRendersRef = useRef(new Map());
  const [activeId, setActiveId] = useState(null);

  const register = useCallback((id, items) => {
    registryRef.current.set(id, items);
  }, []);
  const unregister = useCallback((id) => {
    registryRef.current.delete(id);
  }, []);

  const registerItemRender = useCallback((id, renderFn) => {
    itemRendersRef.current.set(id, renderFn);
  }, []);
  const unregisterItemRender = useCallback((id) => {
    itemRendersRef.current.delete(id);
  }, []);

  const registry = useMemo(
    () => ({ register, unregister, registerItemRender, unregisterItemRender }),
    [register, unregister, registerItemRender, unregisterItemRender]
  );

  const customCollisionDetection = useCallback((args) => {
    // 1. First check if the pointer is directly within any droppable target
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    // 2. Fallback to rectIntersection if pointer is not within but shapes overlap
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    // 3. Fallback to closestCorners if no physical overlap exists
    return closestCorners(args);
  }, []);

  const sensors = useSensors(
    // Mouse: start dragging after a small move so plain clicks still fire the
    // chips' onClick (tap-to-place) instead of being swallowed as drags.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Touch: a short press-and-hold starts a drag; a quick tap or scroll within
    // the tolerance is left alone, so the page still scrolls on mobile.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = useCallback((id) => {
    const map = registryRef.current;
    if (map.has(id)) return id; // the id is itself a container (empty-list drop)
    for (const [containerId, items] of map) {
      if (items.includes(id)) return containerId;
    }
    return null;
  }, []);

  const handleDragStart = useCallback(
    (event) => {
      setActiveId(event.active.id);
      onDragStart?.(event);
    },
    [onDragStart]
  );

  const handleDragEnd = useCallback(
    (event) => {
      setActiveId(null);
      const { active, over } = event;
      const draggableId = String(active?.id ?? "");
      if (!over) {
        onDragEnd?.({ draggableId, source: null, destination: null });
        return;
      }
      const activeId = draggableId;
      const overId = String(over.id);
      const sourceContainer = findContainer(activeId);
      const destContainer = findContainer(overId);
      if (sourceContainer == null || destContainer == null) {
        onDragEnd?.({ draggableId, source: null, destination: null });
        return;
      }
      const sourceItems = registryRef.current.get(sourceContainer) || [];
      const destItems = registryRef.current.get(destContainer) || [];
      const sourceIndex = sourceItems.indexOf(activeId);

      let destIndex;
      if (overId === destContainer) {
        // Dropped on the container itself (empty space / past the last item).
        destIndex = destItems.length;
      } else {
        destIndex = destItems.indexOf(overId);
        if (destIndex < 0) destIndex = destItems.length;
      }

      onDragEnd?.({
        draggableId,
        source: { droppableId: sourceContainer, index: sourceIndex },
        destination: { droppableId: destContainer, index: destIndex },
      });
    },
    [findContainer, onDragEnd]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const renderDragOverlayContent = (id) => {
    const renderFn = itemRendersRef.current.get(id);
    if (!renderFn) return null;
    return renderFn({
      setNodeRef: () => {},
      attributes: {},
      listeners: {},
      style: { opacity: 1, cursor: "grabbing" },
      isDragging: true,
    });
  };

  return (
    <RegistryContext.Provider value={registry}>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay adjustScale={false} dropAnimation={null}>
          {activeId ? renderDragOverlayContent(activeId) : null}
        </DragOverlay>
      </DndContext>
    </RegistryContext.Provider>
  );
}

/**
 * SortableList — replaces <Droppable>. Renders a Chakra Flex (override via `as`)
 * and registers its ordered item ids with the surrounding SortableArea.
 *
 * @param {string} id            droppableId
 * @param {string[]} items       ordered, stable item ids (must match SortableItem ids)
 * @param {object} [activeStyles] Chakra props merged in while a drag hovers this
 *                                list (replacement for snapshot.isDraggingOver),
 *                                e.g. { bg: "...", borderBottomColor: "..." }
 */
export function SortableList({
  id,
  items,
  strategy = rectSortingStrategy,
  activeStyles,
  children,
  ...boxProps
}) {
  const registry = useContext(RegistryContext);
  // Register on every render so the drop adapter always sees current ordering.
  if (registry) registry.register(id, items);
  useEffect(() => {
    return () => registry?.unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { setNodeRef, isOver } = useDroppable({ id });
  const containerValue = useMemo(() => ({ id }), [id]);

  return (
    <ContainerContext.Provider value={containerValue}>
      <SortableContext items={items} strategy={strategy}>
        <Flex
          ref={setNodeRef}
          {...boxProps}
          {...(isOver && activeStyles ? activeStyles : null)}
        >
          {children}
        </Flex>
      </SortableContext>
    </ContainerContext.Provider>
  );
}

/**
 * SortableItem — replaces <Draggable>. Render-prop that hands back the props to
 * spread onto the chip element.
 *
 * <SortableItem id="bank-3">
 *   {({ setNodeRef, attributes, listeners, style, isDragging }) => (
 *     <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>…</Box>
 *   )}
 * </SortableItem>
 */
export function SortableItem({ id, disabled = false, children }) {
  const container = useContext(ContainerContext);
  const registry = useContext(RegistryContext);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled, data: { containerId: container?.id } });

  useEffect(() => {
    if (registry?.registerItemRender) {
      registry.registerItemRender(id, children);
    }
    return () => {
      if (registry?.unregisterItemRender) {
        registry.unregisterItemRender(id);
      }
    };
  }, [id, children, registry]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
    touchAction: "none",
  };

  return children({ setNodeRef, attributes, listeners, style, isDragging });
}
