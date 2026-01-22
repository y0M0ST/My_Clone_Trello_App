import apiFactory from "./api-factory";

export const listApi = {
    create: (boardId: string, title: string) => {
        return apiFactory.post(`/boards/${boardId}/lists`, { title });
    },

    update: (listId: string, title: string) => {
        return apiFactory.patch(`/lists/${listId}`, { title });
    },

    archiveAllCards: (listId: string) => {
        return apiFactory.patch(`/lists/${listId}/archive-all-cards`);
    },

    reorder: (listId: string, prevListId: string | null, nextListId: string | null) => {
        return apiFactory.patch(`/lists/${listId}/reorder`, { prevListId, nextListId });
    }
};