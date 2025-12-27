'use client'

import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import Widget from './Widget'
import clsx from 'clsx'

export default function DraggableWidget({ widget, index, moveWidget, totalWidgets }) {
  const ref = useRef(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: () => ({ id: widget?.id, index, totalWidgets }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !!(widget && widget.id),
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

      const hoverClientY = clientOffset.y - hoverBoundingRect.top
      const hoverClientX = clientOffset.x - hoverBoundingRect.left
      
      const isWithinBounds = 
        hoverClientY >= 0 && 
        hoverClientY <= hoverBoundingRect.height &&
        hoverClientX >= 0 && 
        hoverClientX <= hoverBoundingRect.width

      if (isWithinBounds) {
        moveWidget(dragIndex, hoverIndex)
        item.index = hoverIndex
      }
    }
  })

  drag(drop(ref))

  if (!widget || !widget.id) {
    return null
  }

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

