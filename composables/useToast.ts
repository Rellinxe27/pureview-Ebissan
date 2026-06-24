export const useToast = () => {
  const message = useState<string>('toast:message', () => '')
  const visible = useState<boolean>('toast:visible', () => false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function show(msg: string, duration = 3000) {
    if (timer) clearTimeout(timer)
    message.value = msg
    visible.value = true
    timer = setTimeout(() => { visible.value = false }, duration)
  }

  function hide() {
    if (timer) clearTimeout(timer)
    visible.value = false
  }

  return { message, visible, show, hide }
}
