import { AppDataSource } from '@/config/data-source';
import { Card } from '@/common/entities/card.entity';
import { ActionType } from '@/common/entities/action.entity';

export class CardRepository {
  private cardRepository = AppDataSource.getRepository(Card);

  async getCardById(
    cardId: string,
    queryParams: {
      fields?: string;
      actions?: boolean;
      attachments?: boolean;
      attachment_fields?: string;
      members?: string;
      member_fields?: string;
      checklist?: boolean;
      checkItemFields?: string;
      list?: boolean;
      board?: boolean;
      board_fields?: string;
    }
  ): Promise<Card | null> {
    const query = this.cardRepository
      .createQueryBuilder('card')
      .where('card.id = :cardId', { cardId });

    const {
      fields,
      actions,
      attachments,
      attachment_fields,
      members,
      member_fields,
      checklist,
      checkItemFields,
      list,
      board,
      board_fields,
    } = queryParams;

    const relationFields = [
      'labels',
      'members',
      'list',
      'board',
      'attachments',
      'checklists',
      'comments',
      'actions',
      'cover',
    ];
    if (fields) {
      const fieldsArray = fields.split(',').map((f: string) => f.trim());

      const basicFields = fieldsArray.filter(
        (field: string) => !relationFields.includes(field)
      );
      const requestedRelations = fieldsArray.filter((field: string) =>
        relationFields.includes(field)
      );

      if (basicFields.length > 0) {
        query.select(basicFields.map((field: string) => `card.${field}`));
      } else {
        query.select(['card.id']);
      }

      if (requestedRelations.includes('labels')) {
        query.leftJoin('card.labels', 'label');
        query.addSelect(['label.id', 'label.name', 'label.color']);
      }
      if (requestedRelations.includes('members')) {
        query.leftJoin('card.members', 'member');
        query.addSelect([
          'member.id',
          'member.name',
          'member.email',
          'member.avatarUrl',
        ]);
      }
      if (requestedRelations.includes('list')) {
        query.leftJoin('card.list', 'list');
        query.addSelect(['list.id', 'list.title']);
      }
      if (requestedRelations.includes('board')) {
        query.leftJoin('card.board', 'board');
        query.addSelect(['board.id', 'board.title']);
      }
      if (requestedRelations.includes('attachments')) {
        query.leftJoin('card.attachments', 'attachment');
        query.addSelect(['attachment.id', 'attachment.name', 'attachment.url']);
      }
      if (requestedRelations.includes('checklists')) {
        query.leftJoin('card.checklists', 'checklist');
        query.addSelect(['checklist.id', 'checklist.name']);
      }
      if (requestedRelations.includes('comments')) {
        query
          .leftJoin('card.actions', 'action')
          .where('action.type = :type', { type: 'commentCard' })
          .addSelect(['action.id', 'action.data', 'action.date']);
      }
      if (requestedRelations.includes('actions')) {
        query
          .leftJoin('card.actions', 'action')
          .addSelect([
            'action.id',
            'action.type',
            'action.data',
            'action.date',
          ]);
      }

      return await query.getOne();
    }

    query
      .leftJoin('card.labels', 'label')
      .addSelect(['label.id', 'label.name', 'label.color']);

    if (actions) {
      query
        .leftJoin('card.actions', 'action')
        .addSelect(['action.id', 'action.type', 'action.data', 'action.date']);
    }

    if (attachments) {
      query.leftJoinAndSelect('card.attachments', 'attachment');
      if (attachment_fields) {
        const attachmentFieldsArray = attachment_fields.split(',');
        query.addSelect(
          attachmentFieldsArray.map((field: string) => `attachment.${field}`)
        );
      }
    }

    if (members) {
      query.leftJoinAndSelect('card.members', 'member');
      if (member_fields) {
        const memberFieldsArray = member_fields.split(',');
        query.addSelect(
          memberFieldsArray.map((field: string) => `member.${field}`)
        );
      }
    }

    if (checklist) {
      query
        .leftJoinAndSelect('card.checklists', 'checklist')
        .leftJoinAndSelect('checklist.checkItems', 'checkItem');
      if (checkItemFields) {
        const checkItemFieldsArray = checkItemFields.split(',');
        query.addSelect(
          checkItemFieldsArray.map((field: string) => `checklist.${field}`)
        );
      }
    }

    if (list) {
      query.leftJoinAndSelect('card.list', 'list');
    }

    if (board) {
      if (board_fields) {
        const boardFieldsArray = board_fields.split(',');
        query.leftJoin('card.board', 'board');
        query.addSelect(
          boardFieldsArray.map((field: string) => `board.${field}`)
        );
      } else {
        query.leftJoinAndSelect('card.board', 'board');
      }
    }

    return await query.getOne();
  }

  async getCardWithMembers(cardId: string): Promise<Card | null> {
    return this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['members'],
      select: {
        id: true,
        title: true,
        members: {
          id: true,
          name: true,
          email: true,
        },
      },
    });
  }

  async createCard(
    listId: string,
    boardId: string,
    cardData: {
      title: string;
      description?: string;
      position?: number;
      coverUrl?: string;
      start?: Date;
      due?: Date;
      isCompleted?: boolean;
      coverId?: string;
    },
    copyOptions?: {
      sourceCardId: string;
      copyMembers: boolean;
      copyLabels: boolean;
      copyComments: boolean;
      copyAttachments: boolean;
      copyChecklists: boolean;
    },
    userId?: string
  ): Promise<Card> {
    console.log('Create data:', cardData);
    console.log('Copy options:', copyOptions);
    const queryRunner =
      this.cardRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Card)
        .values({
          listId,
          boardId,
          title: cardData.title,
          description: cardData.description,
          position: cardData.position,
          coverUrl: cardData.coverUrl,
          start: cardData.start,
          due: cardData.due,
          isCompleted: cardData.isCompleted || false,
          coverId: cardData.coverId || null,
        })
        .returning([
          'id',
          'title',
          'description',
          'position',
          'coverUrl',
          'start',
          'due',
          'isCompleted',
        ])
        .execute();

      const newCard = result.raw[0] as Card;

      if (copyOptions?.sourceCardId) {
        const sourceCard = await queryRunner.manager
          .createQueryBuilder(Card, 'card')
          .leftJoinAndSelect('card.members', 'member')
          .leftJoinAndSelect('card.labels', 'label')
          .leftJoinAndSelect('card.attachments', 'attachment')
          .leftJoinAndSelect('card.checklists', 'checklist')
          .leftJoinAndSelect('checklist.checkItems', 'checkItem')
          .leftJoinAndSelect('card.actions', 'action')
          .where('card.id = :cardId', { cardId: copyOptions.sourceCardId })
          .getOne();

        if (sourceCard) {
          const copyPromises: Promise<any>[] = [];

          // Copy labels
          if (copyOptions.copyLabels && sourceCard.labels?.length > 0) {
            const labelIds = sourceCard.labels.map((l) => l.id);
            copyPromises.push(
              queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into('card_labels')
                .values(
                  labelIds.map((labelId) => ({
                    cardId: newCard.id,
                    labelId,
                  }))
                )
                .execute()
            );
          }

          // Copy members
          if (copyOptions.copyMembers && sourceCard.members?.length > 0) {
            const memberIds = sourceCard.members.map((m) => m.id);
            copyPromises.push(
              queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into('card_members')
                .values(
                  memberIds.map((userId) => ({
                    cardId: newCard.id,
                    userId,
                  }))
                )
                .execute()
            );
          }

          // Copy attachments
          if (
            copyOptions.copyAttachments &&
            sourceCard.attachments?.length > 0
          ) {
            const attachmentIds = sourceCard.attachments.map((a) => a.id);
            copyPromises.push(
              queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into('attachments')
                .values(
                  queryRunner.manager
                    .createQueryBuilder()
                    .select([
                      'name',
                      'url',
                      'mimeType',
                      `'${newCard.id}' as "cardId"`,
                    ])
                    .from('attachments', 'attachment')
                    .where('attachment.id IN (:...attachmentIds)', {
                      attachmentIds,
                    })
                )
                .execute()
            );
          }

          // Copy comments (actions with type commentCard)
          if (copyOptions.copyComments && sourceCard.actions?.length > 0) {
            const commentActions = sourceCard.actions.filter(
              (a) => a.type === 'commentCard'
            );
            if (commentActions.length > 0) {
              copyPromises.push(
                queryRunner.manager
                  .createQueryBuilder()
                  .insert()
                  .into('action')
                  .values(
                    commentActions.map((action) => ({
                      type: action.type,
                      data: action.data,
                      date: new Date(),
                      cardId: newCard.id,
                      memberCreator: action.memberCreator,
                    }))
                  )
                  .execute()
              );
            }
          }

          // Copy checklists với checkItems
          if (copyOptions.copyChecklists && sourceCard.checklists?.length > 0) {
            for (const checklist of sourceCard.checklists) {
              const checklistResult = await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into('checklists')
                .values({
                  name: checklist.name,
                  position: checklist.position,
                  cardId: newCard.id,
                })
                .returning(['id'])
                .execute();

              const newChecklistId = checklistResult.raw[0].id;

              if (checklist.checkItems?.length > 0) {
                await queryRunner.manager
                  .createQueryBuilder()
                  .insert()
                  .into('check_items')
                  .values(
                    checklist.checkItems.map((item) => ({
                      name: item.name,
                      position: item.position,
                      checklistId: newChecklistId,
                    }))
                  )
                  .execute();
              }
            }
          }

          // Chạy tất cả promises song song
          await Promise.all(copyPromises);
        }
      }

      if (userId) {
        const actionType = copyOptions?.sourceCardId
          ? ActionType.COPY_CARD
          : ActionType.CREATE_CARD;
        const actionData: any = {
          card: {
            id: newCard.id,
            title: newCard.title,
          },
          list: { id: listId },
          board: { id: boardId },
        };

        if (copyOptions?.sourceCardId) {
          actionData.cardSource = { id: copyOptions.sourceCardId };
        }

        await this.createAction(
          newCard.id,
          userId,
          actionType,
          actionData,
          queryRunner
        );
      }

      await queryRunner.commitTransaction();
      return newCard;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateCard(
    cardId: string,
    updateData: {
      title?: string;
      description?: string;
      position?: number;
      isArchived?: boolean;
      listId?: string;
      boardId?: string;
      coverUrl?: string;
      start?: Date;
      due?: Date;
      isCompleted?: boolean;
    }
  ): Promise<Card | null> {
    const result = await this.cardRepository
      .createQueryBuilder()
      .update(Card)
      .set(updateData)
      .where('id = :cardId', { cardId })
      .returning([
        'id',
        'title',
        'description',
        'position',
        'isArchived',
        'listId',
        'boardId',
        'coverUrl',
        'start',
        'due',
        'isCompleted',
        'memberIds',
        'labelIds',
      ])
      .execute();
    return result.raw[0] as Card;
  }

  async deleteCard(cardId: string): Promise<boolean> {
    const result = await this.cardRepository.delete(cardId);
    return result.affected !== undefined && result.affected > 0;
  }

  async addLabelToCard(
    cardId: string,
    labelId: string,
    userId?: string
  ): Promise<void> {
    await this.cardRepository
      .createQueryBuilder()
      .relation(Card, 'labels')
      .of(cardId)
      .add(labelId);

    if (userId) {
      await this.createAction(cardId, userId, ActionType.ADD_LABEL, {
        label: { id: labelId },
      });
    }
  }

  async removeLabelFromCard(
    cardId: string,
    labelId: string,
    userId?: string
  ): Promise<void> {
    await this.cardRepository
      .createQueryBuilder()
      .relation(Card, 'labels')
      .of(cardId)
      .remove(labelId);

    if (userId) {
      await this.createAction(cardId, userId, ActionType.REMOVE_LABEL, {
        label: { id: labelId },
      });
    }
  }

  async addMemberToCard(
    cardId: string,
    memberId: string,
    userId?: string
  ): Promise<void> {
    await this.cardRepository
      .createQueryBuilder()
      .relation(Card, 'members')
      .of(cardId)
      .add(memberId);

    if (userId) {
      await this.createAction(cardId, userId, ActionType.ADD_MEMBER, {
        member: { id: memberId },
      });
    }
  }

  async removeMemberFromCard(
    cardId: string,
    memberId: string,
    userId?: string
  ): Promise<void> {
    await this.cardRepository
      .createQueryBuilder()
      .relation(Card, 'members')
      .of(cardId)
      .remove(memberId);

    if (userId) {
      await this.createAction(cardId, userId, ActionType.REMOVE_MEMBER, {
        member: { id: memberId },
      });
    }
  }

  async getActions(
    cardId: string,
    filter?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ actions: any[]; total: number }> {
    const query = this.cardRepository.manager
      .createQueryBuilder()
      .select('action')
      .from('action', 'action')
      .leftJoin('action.memberCreator', 'user')
      .addSelect(['user.id', 'user.email', 'user.name', 'user.avatarUrl'])
      .where('action.cardId = :cardId', { cardId })
      .orderBy('action.date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filter) {
      query.andWhere('action.type = :filter', { filter });
    }

    const [actions, total] = await query.getManyAndCount();
    return { actions, total };
  }

  async addComment(cardId: string, userId: string, text: string): Promise<any> {
    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .insert()
      .into('action')
      .values({
        type: 'commentCard',
        cardId,
        memberCreator: userId,
        data: { text },
        date: new Date(),
      })
      .returning(['id', 'type', 'data', 'date', 'cardId'])
      .execute();

    const action = result.raw[0];

    const actionWithUser = await this.cardRepository.manager
      .createQueryBuilder()
      .select('action')
      .from('action', 'action')
      .leftJoin('action.memberCreator', 'user')
      .addSelect(['user.id', 'user.email', 'user.name', 'user.avatarUrl'])
      .where('action.id = :id', { id: action.id })
      .getOne();

    return actionWithUser;
  }

  async updateComment(
    cardId: string,
    actionId: string,
    text: string
  ): Promise<any> {
    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .update('action')
      .set({ data: { text } })
      .where('id = :actionId', { actionId })
      .andWhere('cardId = :cardId', { cardId })
      .andWhere('type = :type', { type: 'commentCard' })
      .returning(['id', 'type', 'data', 'date', 'cardId'])
      .execute();

    if (result.affected === 0) {
      return null;
    }

    const actionWithUser = await this.cardRepository.manager
      .createQueryBuilder()
      .select('action')
      .from('action', 'action')
      .leftJoin('action.memberCreator', 'user')
      .addSelect(['user.id', 'user.email', 'user.name', 'user.avatarUrl'])
      .where('action.id = :id', { id: actionId })
      .getOne();

    return actionWithUser;
  }

  async deleteComment(cardId: string, actionId: string): Promise<boolean> {
    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .delete()
      .from('action')
      .where('id = :actionId', { actionId })
      .andWhere('cardId = :cardId', { cardId })
      .andWhere('type = :type', { type: 'commentCard' })
      .execute();

    return result.affected !== undefined && result.affected > 0;
  }

  private async createAction(
    cardId: string,
    userId: string,
    type: string,
    data: any,
    queryRunner?: any
  ): Promise<void> {
    const manager = queryRunner
      ? queryRunner.manager
      : this.cardRepository.manager;
    await manager
      .createQueryBuilder()
      .insert()
      .into('action')
      .values({
        type,
        cardId,
        memberCreator: userId,
        data,
        date: new Date(),
      })
      .execute();
  }

  async logUpdateAction(
    cardId: string,
    userId: string,
    changes: any
  ): Promise<void> {
    await this.createAction(cardId, userId, ActionType.UPDATE_CARD, {
      changes,
    });
  }

  async createAttachment(
    cardId: string,
    userId: string,
    attachmentData: {
      name: string;
      url: string;
      mimeType?: string;
      bytes?: number;
      setCover?: boolean;
    }
  ): Promise<any> {
    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .insert()
      .into('attachments')
      .values({
        cardId,
        userId,
        name: attachmentData.name,
        url: attachmentData.url,
        mimeType: attachmentData.mimeType,
        bytes: attachmentData.bytes,
      })
      .returning(['id', 'name', 'url', 'mimeType', 'bytes', 'cardId', 'userId'])
      .execute();

    const attachment = result.raw[0];

    if (attachmentData.setCover) {
      await this.cardRepository
        .createQueryBuilder()
        .update(Card)
        .set({ coverUrl: attachmentData.url })
        .where('id = :cardId', { cardId })
        .execute();
    }

    await this.createAction(cardId, userId, ActionType.ADD_ATTACHMENT, {
      attachment: { id: attachment.id, name: attachment.name },
    });

    return attachment;
  }

  async deleteAttachment(
    cardId: string,
    attachmentId: string,
    userId: string
  ): Promise<boolean> {
    const attachment = await this.cardRepository.manager
      .createQueryBuilder()
      .select('attachment')
      .from('attachments', 'attachment')
      .where('attachment.id = :attachmentId', { attachmentId })
      .andWhere('attachment.cardId = :cardId', { cardId })
      .getOne();

    if (!attachment) {
      return false;
    }

    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .delete()
      .from('attachments')
      .where('id = :attachmentId', { attachmentId })
      .andWhere('cardId = :cardId', { cardId })
      .execute();

    if (result.affected && result.affected > 0) {
      await this.createAction(cardId, userId, ActionType.REMOVE_ATTACHMENT, {
        attachment: { id: attachmentId, name: attachment.name },
      });
      return true;
    }

    return false;
  }

  async getAttachments(cardId: string, fields?: string): Promise<any[]> {
    const query = this.cardRepository.manager
      .createQueryBuilder()
      .select('attachment')
      .from('attachments', 'attachment')
      .where('attachment.cardId = :cardId', { cardId });

    if (fields) {
      const fieldsArray = fields.split(',').map((f: string) => f.trim());
      query.select(fieldsArray.map((field: string) => `attachment.${field}`));
    }

    return await query.getMany();
  }

  async getAttachment(
    cardId: string,
    attachmentId: string,
    fields?: string
  ): Promise<any | null> {
    const query = this.cardRepository.manager
      .createQueryBuilder()
      .select('attachment')
      .from('attachments', 'attachment')
      .where('attachment.id = :attachmentId', { attachmentId })
      .andWhere('attachment.cardId = :cardId', { cardId });

    if (fields) {
      const fieldsArray = fields.split(',').map((f: string) => f.trim());
      query.select(fieldsArray.map((field: string) => `attachment.${field}`));
    }

    return await query.getOne();
  }

  async getChecklists(
    cardId: string,
    checkItems?: boolean,
    filter?: string,
    fields?: string
  ): Promise<any[]> {
    const query = this.cardRepository.manager
      .createQueryBuilder()
      .select('checklist')
      .from('checklists', 'checklist')
      .where('checklist.cardId = :cardId', { cardId })
      .orderBy('checklist.position', 'ASC');

    if (checkItems) {
      query
        .leftJoin('checklist.checkItems', 'checkItem')
        .addSelect([
          'checkItem.id',
          'checkItem.name',
          'checkItem.position',
          'checkItem.isChecked',
          'checkItem.due',
          'checkItem.dueReminder',
        ])
        .addOrderBy('checkItem.position', 'ASC');
    }

    if (fields) {
      const fieldsArray = fields.split(',').map((f: string) => f.trim());
      query.select(fieldsArray.map((field: string) => `checklist.${field}`));
    }

    return await query.getMany();
  }

  async getChecklist(
    cardId: string,
    checklistId: string,
    fields?: string
  ): Promise<Record<string, unknown> | null> {
    const query = this.cardRepository.manager
      .createQueryBuilder()
      .select('checklist')
      .from('checklists', 'checklist')
      .where('checklist.id = :checklistId', { checklistId })
      .andWhere('checklist.cardId = :cardId', { cardId });
    if (fields) {
      const fieldsArray = fields.split(',').map((f: string) => f.trim());
      query.select(fieldsArray.map((field: string) => `checklist.${field}`));
    }
    return await query.getOne();
  }

  async createChecklist(
    cardId: string,
    checklistData: {
      name: string;
      position?: number;
    },
    sourceChecklistId?: string,
    userId?: string
  ): Promise<any> {
    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .insert()
      .into('checklists')
      .values({
        cardId,
        name: checklistData.name,
        position: checklistData.position || 0,
      })
      .returning(['id', 'name', 'position', 'cardId'])
      .execute();

    const newChecklist = result.raw[0];

    if (sourceChecklistId) {
      const sourceCheckItems = await this.cardRepository.manager
        .createQueryBuilder()
        .select('checkItem')
        .from('checkItems', 'checkItem')
        .where('checkItem.checklistId = :checklistId', {
          checklistId: sourceChecklistId,
        })
        .orderBy('checkItem.position', 'ASC')
        .getMany();

      if (sourceCheckItems.length > 0) {
        await this.cardRepository.manager
          .createQueryBuilder()
          .insert()
          .into('checkItems')
          .values(
            sourceCheckItems.map((item: any) => ({
              name: item.name,
              position: item.position,
              isChecked: false,
              checklistId: newChecklist.id,
            }))
          )
          .execute();
      }
    }

    if (userId) {
      await this.createAction(cardId, userId, ActionType.ADD_CHECKLIST, {
        checklist: { id: newChecklist.id, name: newChecklist.name },
      });
    }

    return newChecklist;
  }

  async updateChecklist(
    cardId: string,
    checklistId: string,
    updateData: { name?: string; position?: number }
  ): Promise<Record<string, unknown> | null> {
    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .update('checklists')
      .set(updateData)
      .where('id = :checklistId', { checklistId })
      .andWhere('cardId = :cardId', { cardId })
      .returning(['id', 'name', 'position', 'cardId'])
      .execute();

    return result.affected ? result.raw[0] : null;
  }

  async deleteChecklist(
    cardId: string,
    checklistId: string,
    userId?: string
  ): Promise<boolean> {
    const checklist = await this.cardRepository.manager
      .createQueryBuilder()
      .select('checklist')
      .from('checklists', 'checklist')
      .where('checklist.id = :checklistId', { checklistId })
      .andWhere('checklist.cardId = :cardId', { cardId })
      .getOne();

    if (!checklist) {
      return false;
    }

    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .delete()
      .from('checklists')
      .where('id = :checklistId', { checklistId })
      .andWhere('cardId = :cardId', { cardId })
      .execute();

    if (result.affected && result.affected > 0) {
      if (userId) {
        await this.createAction(cardId, userId, ActionType.REMOVE_CHECKLIST, {
          checklist: { id: checklistId, name: checklist.name },
        });
      }
      return true;
    }

    return false;
  }

  async getCheckItems(
    checklistId: string,
    filter?: string,
    fields?: string
  ): Promise<any[]> {
    const query = this.cardRepository.manager
      .createQueryBuilder()
      .select('checkItem')
      .from('checkItems', 'checkItem')
      .where('checkItem.checklistId = :checklistId', { checklistId })
      .orderBy('checkItem.position', 'ASC');

    if (filter === 'all' || !filter) {
    } else if (filter === 'none') {
      query.andWhere('1 = 0');
    }

    if (fields) {
      const fieldsArray = fields.split(',').map((f: string) => f.trim());
      query.select(fieldsArray.map((field: string) => `checkItem.${field}`));
    }

    return await query.getMany();
  }

  async getCheckItem(
    checklistId: string,
    checkItemId: string
  ): Promise<Record<string, unknown> | null> {
    return await this.cardRepository.manager
      .createQueryBuilder()
      .select('checkItem')
      .from('checkItems', 'checkItem')
      .where('checkItem.id = :checkItemId', { checkItemId })
      .andWhere('checkItem.checklistId = :checklistId', { checklistId })
      .getOne();
  }

  async createCheckItem(
    checklistId: string,
    checkItemData: {
      name: string;
      position?: number;
      isChecked?: boolean;
      due?: Date;
      dueReminder?: Date;
    }
  ): Promise<any> {
    const checklist = await this.cardRepository.manager
      .createQueryBuilder()
      .select('checklist.cardId')
      .from('checklists', 'checklist')
      .where('checklist.id = :checklistId', { checklistId })
      .getRawOne();

    if (!checklist) {
      throw new Error('Checklist not found');
    }

    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .insert()
      .into('checkItems')
      .values({
        checklistId,
        name: checkItemData.name,
        position: checkItemData.position || 0,
        isChecked: checkItemData.isChecked || false,
        due: checkItemData.due,
        dueReminder: checkItemData.dueReminder,
      })
      .returning([
        'id',
        'name',
        'position',
        'isChecked',
        'due',
        'dueReminder',
        'checklistId',
      ])
      .execute();

    const newCheckItem = result.raw[0];

    return newCheckItem;
  }

  async updateCheckItem(
    checklistId: string,
    checkItemId: string,
    updateData: {
      name?: string;
      position?: number;
      isChecked?: boolean;
      due?: Date;
      dueReminder?: Date;
      checklistId?: string;
    },
    userId?: string
  ): Promise<Record<string, unknown> | null> {
    const oldCheckItem = await this.getCheckItem(checklistId, checkItemId);

    const targetChecklistId = updateData.checklistId || checklistId;
    const checklist = await this.cardRepository.manager
      .createQueryBuilder()
      .select('checklist.cardId')
      .from('checklists', 'checklist')
      .where('checklist.id = :checklistId', { checklistId: targetChecklistId })
      .getRawOne();

    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .update('checkItems')
      .set({
        name: updateData.name,
        position: updateData.position,
        isChecked: updateData.isChecked,
        due: updateData.due,
        dueReminder: updateData.dueReminder,
        checklistId: targetChecklistId,
      })
      .where('id = :checkItemId', { checkItemId })
      .andWhere('checklistId = :checklistId', { checklistId })
      .returning([
        'id',
        'name',
        'position',
        'isChecked',
        'due',
        'dueReminder',
        'checklistId',
      ])
      .execute();

    if (result.affected && userId) {
      const changes: any = {};
      if (
        updateData.isChecked !== undefined &&
        updateData.isChecked !== oldCheckItem.isChecked
      ) {
        changes.isChecked = {
          old: oldCheckItem.isChecked,
          new: updateData.isChecked,
        };
      }
      if (Object.keys(changes).length > 0) {
        await this.createAction(
          checklist.checklist_cardId,
          userId,
          ActionType.CHECK_CHECKITEM,
          {
            checkItem: { id: checkItemId },
            checklist: { id: targetChecklistId },
            changes,
          }
        );
      }
    }

    return result.affected ? result.raw[0] : null;
  }

  async deleteCheckItem(
    checklistId: string,
    checkItemId: string
  ): Promise<boolean> {
    const checkItem = await this.getCheckItem(checklistId, checkItemId);
    if (!checkItem) {
      return false;
    }

    const checklist = await this.cardRepository.manager
      .createQueryBuilder()
      .select('checklist.cardId')
      .from('checklists', 'checklist')
      .where('checklist.id = :checklistId', { checklistId })
      .getRawOne();

    if (!checklist) {
      throw new Error('Checklist not found');
    }

    const result = await this.cardRepository.manager
      .createQueryBuilder()
      .delete()
      .from('checkItems')
      .where('id = :checkItemId', { checkItemId })
      .andWhere('checklistId = :checklistId', { checklistId })
      .execute();

    if (result.affected && result.affected > 0) {
      return true;
    }

    return false;
  }

  async getCardsByListId(listId: string): Promise<Card[]> {
    const cardRepo = AppDataSource.getRepository(Card);

    return await cardRepo.find({
      where: { listId },
      order: { position: 'ASC' },
    });
  }
}
