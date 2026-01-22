import apiFactory from "./api-factory";

export interface CreateCardPayload {
    listId: string;
    title: string;
    description?: string;
}

export const cardApi = {
    create: (data: CreateCardPayload) => {
        return apiFactory.post("/cards", data);
    },
    update: (cardId: string, data: any) => {
        return apiFactory.put(`/cards/${cardId}`, data);
    },

    delete: (cardId: string) => {
        return apiFactory.delete(`/cards/${cardId}`);
    },

    moveCard: (data: {
        cardId: string,
        prevColumnId: string,
        prevIndex: number,
        nextColumnId: string,
        nextIndex: number
    }) => {
        return apiFactory.patch('/cards/move', data);
    }
};