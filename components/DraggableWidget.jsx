'use client'

import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import Widget from './Widget'
import clsx from 'clsx'

export default function DraggableWidget({ widget, index, moveWidget }) {
  const ref = useRef(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { id: widget.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ handlerId, isOver }, drop] = useDrop({
    accept: 'widget',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
      }
    },
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const clientOffset = monitor.getClientOffset()
      
      if (!clientOffset) return

      // More flexible placement - allow movement in any direction
      // Only check if we're actually over this widget's area
      const hoverClientY = clientOffset.y - hoverBoundingRect.top
      const hoverClientX = clientOffset.x - hoverBoundingRect.left
      
      // Check if cursor is within the widget bounds
      const isWithinBounds = 
        hoverClientY >= 0 && 
        hoverClientY <= hoverBoundingRect.height &&
        hoverClientX >= 0 && 
        hoverClientX <= hoverBoundingRect.width

      if (isWithinBounds) {
        moveWidget(dragIndex, hoverIndex)
        item.index = hoverIndex
      }
    },
  })

  drag(drop(ref))

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={clsx(
        'transition-all',
        isDragging && 'opacity-50 scale-95',
        isOver && !isDragging && 'ring-2 ring-primary-500 dark:ring-primary-400 rounded-lg'
      )}
    >
      <Widget widget={widget} index={index} />
    </div>
  )
}

