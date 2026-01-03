import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

export const TOAST_LIMIT = 3
export const TOAST_REMOVE_DELAY = 5000
const TOAST_DISMISS_DELAY = 400

type ToastVariant =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "destructive"

type ToastRootProps = Pick<
  ToastProps,
  "className" | "duration" | "open" | "onOpenChange" | "forceMount" | "type"
>

type ToasterToast = ToastRootProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: ToastVariant
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const toastDurationTimers = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_DISMISS_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const clearDurationTimer = (toastId: string) => {
  const timer = toastDurationTimers.get(toastId)
  if (timer) {
    clearTimeout(timer)
    toastDurationTimers.delete(toastId)
  }
}

const scheduleDurationTimer = (
  toastId: string,
  duration: number | undefined
) => {
  if (duration === Infinity) {
    return
  }

  clearDurationTimer(toastId)

  const timeout = setTimeout(() => {
    dispatch({ type: "DISMISS_TOAST", toastId })
    toastDurationTimers.delete(toastId)
  }, duration ?? TOAST_REMOVE_DELAY)

  toastDurationTimers.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

type ToastReturn = {
  id: string
  dismiss: () => void
  update: (props: ToasterToast) => void
}

type ToastHelpers = {
  success: (title: React.ReactNode, description?: React.ReactNode) => ToastReturn
  error: (title: React.ReactNode, description?: React.ReactNode) => ToastReturn
  info: (title: React.ReactNode, description?: React.ReactNode) => ToastReturn
  warning: (title: React.ReactNode, description?: React.ReactNode) => ToastReturn
}

type ToastFunction = ((props: Toast) => ToastReturn) & ToastHelpers

const createToast = ({
  duration = TOAST_REMOVE_DELAY,
  variant = "default",
  ...props
}: Toast) => {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => {
    clearDurationTimer(id)
    dispatch({ type: "DISMISS_TOAST", toastId: id })
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      variant,
      duration,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  scheduleDurationTimer(id, duration)

  return {
    id: id,
    dismiss,
    update,
  }
}

const toast = ((props: Toast) => createToast(props)) as ToastFunction

toast.success = (title, description) =>
  toast({
    title,
    description,
    variant: "success",
  })

toast.error = (title, description) =>
  toast({
    title,
    description,
    variant: "destructive",
  })

toast.info = (title, description) =>
  toast({
    title,
    description,
    variant: "info",
  })

toast.warning = (title, description) =>
  toast({
    title,
    description,
    variant: "warning",
  })

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
