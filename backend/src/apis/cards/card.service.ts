import { ListRepository } from '@/apis/lists/list.repository';
import { CardRepository } from './card.repository';
import { NotificationService } from '@/apis/notification/notification.service';
import { NotificationType } from '@/common/entities/notification.entity';

export class CardService {
  private cardRepository = new CardRepository();
  private listRepository = new ListRepository();
  private notificationService = new NotificationService();
  async getCard(cardId: string, query: any): Promise<any> {
    const card = await this.cardRepository.getCardById(cardId, query);
    if (!card) {
      throw new Error('Card not found');
    }
    return card;
  }

  async createCard(cardData: any, userId?: string): Promise<any> {
    let { title, description, position, coverUrl, start, due, isCompleted } =
      cardData;
    let coverId: string | null = null;
    const { listId, cardSourceId, keepFromSource } = cardData;
    const list = await this.listRepository.findListById(listId, false);
    if (!list) {
      throw new Error('List not found');
    }
    const boardId = list.boardId;

    let copyMembers = false;
    let copyLabels = false;
    let copyComments = false;
    let copyAttachments = false;
    let copyChecklists = false;

    if (cardSourceId) {
      const sourceCard = await this.cardRepository.getCardById(cardSourceId, {
        fields:
          'title,description,position,coverUrl,start,due,isCompleted,coverId,members,labels,actions,attachments,checklists',
      });
      if (!sourceCard) {
        throw new Error('Source card not found');
      }
      console.log('Source Card:', sourceCard);
      title = title || sourceCard.title;
      description = description || sourceCard.description;
      position = position !== undefined ? position : sourceCard.position;
      coverUrl = coverUrl || sourceCard.coverUrl;
      start = start || sourceCard.start;
      due = due || sourceCard.due;
      isCompleted =
        isCompleted !== undefined ? isCompleted : sourceCard.isCompleted;
      coverId = sourceCard.coverId;

      if (keepFromSource) {
        const keepFields = keepFromSource
          .split(',')
          .map((f: string) => f.trim());
        copyMembers =
          keepFields.includes('members') && sourceCard.members?.length > 0;
        copyLabels =
          keepFields.includes('labels') && sourceCard.labels?.length > 0;
        copyComments =
          keepFields.includes('comments') &&
          sourceCard.actions?.some((a) => a.type === 'commentCard');
        copyAttachments =
          keepFields.includes('attachments') &&
          sourceCard.attachments?.length > 0;
        copyChecklists =
          keepFields.includes('checklists') &&
          sourceCard.checklists?.length > 0;
      }
    }

    const newCard = await this.cardRepository.createCard(
      listId,
      boardId,
      {
        title,
        description,
        position,
        coverUrl,
        start,
        due,
        isCompleted,
        coverId,
      },
      cardSourceId
        ? {
            sourceCardId: cardSourceId,
            copyMembers,
            copyLabels,
            copyComments,
            copyAttachments,
            copyChecklists,
          }
        : undefined,
      userId
    );

    return newCard;
  }

  async updateCard(
    cardId: string,
    updateData: any,
    userId?: string
  ): Promise<any> {
    const oldCard = await this.cardRepository.getCardById(cardId, {});
    if (!oldCard) {
      throw new Error('Card not found');
    }
    const cardWithMembers =
      await this.cardRepository.getCardWithMembers(cardId);

    const {
      title,
      description,
      position,
      isArchived,
      listId,
      boardId,
      coverUrl,
      start,
      due,
      isCompleted,
    } = updateData;
    const updatedCard = await this.cardRepository.updateCard(cardId, {
      title,
      description,
      position,
      isArchived,
      listId,
      boardId,
      coverUrl,
      start,
      due,
      isCompleted,
    });
    if (!updatedCard) {
      throw new Error('Card not found or update failed');
    }

    if (userId) {
      const changes: any = {};
      if (listId !== undefined && listId !== oldCard.listId)
        changes.listId = { old: oldCard.listId, new: listId };
      if (boardId !== undefined && boardId !== oldCard.boardId)
        changes.boardId = { old: oldCard.boardId, new: boardId };
      if (isArchived !== undefined && isArchived !== oldCard.isArchived)
        changes.isArchived = { old: oldCard.isArchived, new: isArchived };
      if (isCompleted !== undefined && isCompleted !== oldCard.isCompleted)
        changes.isCompleted = { old: oldCard.isCompleted, new: isCompleted };
      if (coverUrl !== undefined && coverUrl !== oldCard.coverUrl)
        changes.coverUrl = { old: oldCard.coverUrl, new: coverUrl };
      if (
        start !== undefined &&
        start?.toString() !== oldCard.start?.toString()
      )
        changes.start = { old: oldCard.start, new: start };
      if (due !== undefined && due?.toString() !== oldCard.due?.toString())
        changes.due = { old: oldCard.due, new: due };

      if (Object.keys(changes).length > 0) {
        await this.cardRepository.logUpdateAction(cardId, userId, changes);
      }

      if (
        changes.due &&
        cardWithMembers?.members &&
        cardWithMembers.members.length > 0
      ) {
        const memberIds = cardWithMembers.members.map((member) => member.id);
        await this.notificationService.createAndSendNotificationsToUsers({
          type: NotificationType.CARD_DUE_SOON,
          recipientIds: memberIds,
          notificationData: {
            cardId,
            cardTitle: oldCard.title,
            oldDue: changes.due.old,
            newDue: changes.due.new,
            updaterId: userId,
          },
          excludeUserId: userId,
        });
      }
    }

    return updatedCard;
  }

  async deleteCard(cardId: string): Promise<void> {
    const result = await this.cardRepository.deleteCard(cardId);
    if (!result) {
      throw new Error('Card not found or delete failed');
    }
  }

  async addLabelToCard(
    cardId: string,
    labelId: string,
    userId?: string
  ): Promise<any> {
    const card = await this.cardRepository.getCardById(cardId, {
      fields: 'labels',
    });
    if (!card) {
      throw new Error('Card not found');
    }

    const labelExists = card.labels.some((label) => label.id === labelId);
    if (labelExists) {
      throw new Error('Label already added to card');
    }

    await this.cardRepository.addLabelToCard(cardId, labelId, userId);

    return null;
  }

  async removeLabelFromCard(
    cardId: string,
    labelId: string,
    userId?: string
  ): Promise<any> {
    const card = await this.cardRepository.getCardById(cardId, {
      fields: 'labels',
    });
    if (!card) {
      throw new Error('Card not found');
    }

    const labelExists = card.labels.some((label) => label.id === labelId);
    if (!labelExists) {
      throw new Error('Label not found on card');
    }

    await this.cardRepository.removeLabelFromCard(cardId, labelId, userId);

    return null;
  }

  async addMemberToCard(
    cardId: string,
    memberId: string,
    userId?: string
  ): Promise<any> {
    const card = await this.cardRepository.getCardById(cardId, {
      fields: 'members',
    });
    if (!card) {
      throw new Error('Card not found');
    }

    const memberExists = card.members.some((m) => m.id === memberId);
    if (memberExists) {
      throw new Error('Member already added to card');
    }

    await this.cardRepository.addMemberToCard(cardId, memberId, userId);

    return null;
  }

  async removeMemberFromCard(
    cardId: string,
    memberId: string,
    userId?: string
  ): Promise<any> {
    const card = await this.cardRepository.getCardById(cardId, {
      fields: 'members',
    });
    if (!card) {
      throw new Error('Card not found');
    }

    const memberExists = card.members.some((m) => m.id === memberId);
    if (!memberExists) {
      throw new Error('Member not found on card');
    }

    await this.cardRepository.removeMemberFromCard(cardId, memberId, userId);

    return null;
  }

  async getActions(
    cardId: string,
    filter?: string,
    page?: number
  ): Promise<{ actions: any[]; total: number }> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    return await this.cardRepository.getActions(cardId, filter, page);
  }

  async addComment(cardId: string, userId: string, text: string): Promise<any> {
    const card = await this.cardRepository.getCardWithMembers(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    const action = await this.cardRepository.addComment(cardId, userId, text);
    if (card.members && card.members.length > 0) {
      const memberIds = card.members.map((member) => member.id);
      await this.notificationService.createAndSendNotificationsToUsers({
        type: NotificationType.CARD_COMMENT,
        recipientIds: memberIds,
        actionId: action.id,
        notificationData: {
          cardId,
          cardTitle: card.title,
          text,
          commenterId: userId,
        },
        excludeUserId: userId,
      });
    }

    return action;
  }

  async updateComment(
    cardId: string,
    actionId: string,
    text: string
  ): Promise<any> {
    const action = await this.cardRepository.updateComment(
      cardId,
      actionId,
      text
    );
    if (!action) {
      throw new Error('Comment not found or update failed');
    }
    return action;
  }

  async deleteComment(cardId: string, actionId: string): Promise<void> {
    const result = await this.cardRepository.deleteComment(cardId, actionId);
    if (!result) {
      throw new Error('Comment not found or delete failed');
    }
  }

  async createAttachment(
    cardId: string,
    userId: string,
    attachmentData: {
      name: string;
      url?: string;
      file?: Express.Multer.File;
      setCover?: boolean;
    }
  ): Promise<any> {
    const card = await this.cardRepository.getCardWithMembers(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    let url = attachmentData.url || '';
    let mimeType: string | undefined;
    let bytes: number | undefined;

    if (attachmentData.file) {
      const { uploadAttachmentToCloudinary } =
        await import('@/config/cloudinary');
      const uploadResult = await uploadAttachmentToCloudinary(
        attachmentData.file
      );
      url = uploadResult.url;
      mimeType = uploadResult.mimeType;
      bytes = uploadResult.bytes;
    }

    if (!url) {
      throw new Error('Either url or file must be provided');
    }

    const attachment = await this.cardRepository.createAttachment(
      cardId,
      userId,
      {
        name: attachmentData.name,
        url,
        mimeType,
        bytes,
        setCover: attachmentData.setCover,
      }
    );

    if (card.members && card.members.length > 0) {
      const memberIds = card.members.map((member) => member.id);
      await this.notificationService.createAndSendNotificationsToUsers({
        type: NotificationType.CARD_ATTACHMENT_ADDED,
        recipientIds: memberIds,
        notificationData: {
          cardId,
          cardTitle: card.title,
          attachmentName: attachmentData.name,
          attachmentId: attachment.id,
          uploaderId: userId,
        },
        excludeUserId: userId,
      });
    }

    return attachment;
  }

  async deleteAttachment(
    cardId: string,
    attachmentId: string,
    userId: string
  ): Promise<void> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    const result = await this.cardRepository.deleteAttachment(
      cardId,
      attachmentId,
      userId
    );
    if (!result) {
      throw new Error('Attachment not found or delete failed');
    }
  }

  async getAttachments(cardId: string, fields?: string): Promise<any[]> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    return await this.cardRepository.getAttachments(cardId, fields);
  }

  async getAttachment(
    cardId: string,
    attachmentId: string,
    fields?: string
  ): Promise<any> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    const attachment = await this.cardRepository.getAttachment(
      cardId,
      attachmentId,
      fields
    );
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    return attachment;
  }

  async getChecklists(
    cardId: string,
    checkItems?: boolean,
    filter?: string,
    fields?: string
  ): Promise<any[]> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    return await this.cardRepository.getChecklists(
      cardId,
      checkItems,
      filter,
      fields
    );
  }

  async createChecklist(
    cardId: string,
    checklistData: {
      name: string;
      position?: number;
      checklistSourceId?: string;
    },
    userId?: string
  ): Promise<any> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    return await this.cardRepository.createChecklist(
      cardId,
      {
        name: checklistData.name,
        position: checklistData.position,
      },
      checklistData.checklistSourceId,
      userId
    );
  }

  async updateChecklist(
    cardId: string,
    checklistId: string,
    updateData: { name?: string; position?: number }
  ): Promise<any> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    const updated = await this.cardRepository.updateChecklist(
      cardId,
      checklistId,
      updateData
    );
    if (!updated) {
      throw new Error('Checklist not found or update failed');
    }

    return updated;
  }

  async deleteChecklist(
    cardId: string,
    checklistId: string,
    userId?: string
  ): Promise<void> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    const result = await this.cardRepository.deleteChecklist(
      cardId,
      checklistId,
      userId
    );
    if (!result) {
      throw new Error('Checklist not found or delete failed');
    }
  }

  async getCheckItems(
    cardId: string,
    checklistId: string,
    filter?: string,
    fields?: string
  ): Promise<any[]> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    return await this.cardRepository.getCheckItems(checklistId, filter, fields);
  }

  async getCheckItem(
    cardId: string,
    checklistId: string,
    checkItemId: string
  ): Promise<any> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    const checkItem = await this.cardRepository.getCheckItem(
      checklistId,
      checkItemId
    );
    if (!checkItem) {
      throw new Error('CheckItem not found');
    }

    return checkItem;
  }

  async createCheckItem(
    cardId: string,
    checklistId: string,
    checkItemData: {
      name: string;
      position?: number;
      isChecked?: boolean;
      due?: string;
      dueReminder?: string;
    }
  ): Promise<any> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    return await this.cardRepository.createCheckItem(checklistId, {
      name: checkItemData.name,
      position: checkItemData.position,
      isChecked: checkItemData.isChecked,
      due: checkItemData.due ? new Date(checkItemData.due) : undefined,
      dueReminder: checkItemData.dueReminder
        ? new Date(checkItemData.dueReminder)
        : undefined,
    });
  }

  async updateCheckItem(
    cardId: string,
    checklistId: string,
    checkItemId: string,
    updateData: {
      name?: string;
      position?: number;
      isChecked?: boolean;
      due?: string;
      dueReminder?: string;
      checklistId?: string;
    },
    userId?: string
  ): Promise<any> {
    const [card, checklist, newChecklist] = await Promise.all([
      this.cardRepository.getCardById(cardId, {}),
      this.cardRepository.getChecklist(cardId, checklistId),
      updateData.checklistId
        ? this.cardRepository.getChecklist(cardId, updateData.checklistId)
        : null,
    ]);
    if (!card) {
      throw new Error('Card not found');
    }

    if (!checklist) {
      throw new Error('Checklist not found');
    }

    if (updateData.checklistId && !newChecklist) {
      throw new Error('New checklist not found');
    }

    const updated = await this.cardRepository.updateCheckItem(
      checklistId,
      checkItemId,
      {
        name: updateData.name,
        position: updateData.position,
        isChecked: updateData.isChecked,
        due: updateData.due ? new Date(updateData.due) : undefined,
        dueReminder: updateData.dueReminder
          ? new Date(updateData.dueReminder)
          : undefined,
        checklistId: updateData.checklistId,
      },
      userId
    );

    if (!updated) {
      throw new Error('CheckItem not found or update failed');
    }

    return updated;
  }

  async deleteCheckItem(
    cardId: string,
    checklistId: string,
    checkItemId: string
  ): Promise<void> {
    const card = await this.cardRepository.getCardById(cardId, {});
    if (!card) {
      throw new Error('Card not found');
    }

    const result = await this.cardRepository.deleteCheckItem(
      checklistId,
      checkItemId
    );
    if (!result) {
      throw new Error('CheckItem not found or delete failed');
    }
  }

  async moveCard(data: {
    cardId: string;
    prevColumnId: string;
    prevIndex: number;
    nextColumnId: string;
    nextIndex: number;
  }): Promise<any> {
    const { cardId, prevColumnId, prevIndex, nextColumnId, nextIndex } = data;
    const cardToMove = await this.cardRepository.getCardById(cardId, {});
    if (!cardToMove) throw new Error('Card not found');
    if (prevColumnId === nextColumnId) {
      if (prevIndex === nextIndex) return cardToMove;

      const cardsInList =
        await this.cardRepository.getCardsByListId(prevColumnId);
      const newOrderedCards = [...cardsInList];
      const [removed] = newOrderedCards.splice(prevIndex, 1);
      newOrderedCards.splice(nextIndex, 0, removed);
      await Promise.all(
        newOrderedCards.map((card, index) =>
          this.cardRepository.updateCard(card.id, { position: index })
        )
      );

      return { ...cardToMove, position: nextIndex };
    } else {
      const cardsInPrevList =
        await this.cardRepository.getCardsByListId(prevColumnId);
      const newPrevList = cardsInPrevList.filter((c) => c.id !== cardId);

      await Promise.all(
        newPrevList.map((card, index) =>
          this.cardRepository.updateCard(card.id, { position: index })
        )
      );

      const cardsInNextList =
        await this.cardRepository.getCardsByListId(nextColumnId);
      const newNextList = [...cardsInNextList];
      const updatedCardData = { listId: nextColumnId };
      newNextList.splice(nextIndex, 0, {
        ...cardToMove,
        ...updatedCardData,
      } as any);
      await Promise.all(
        newNextList.map((card, index) => {
          if (card.id === cardId) {
            return this.cardRepository.updateCard(card.id, {
              listId: nextColumnId,
              position: index,
            });
          }
          return this.cardRepository.updateCard(card.id, { position: index });
        })
      );

      return { ...cardToMove, listId: nextColumnId, position: nextIndex };
    }
  }
}
