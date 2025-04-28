export const broadcast_event = (event_name: string, data: any) => {
    return new CustomEvent(event_name, {
        detail: data
    })
}