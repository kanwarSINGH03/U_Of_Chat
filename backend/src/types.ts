import {Key} from "aws-sdk/clients/dynamodb";

export type Action =
    | "getClients"
    | "getMessages"
    | "sendMessage"
    | "$connect"
    | "$disconnect";

export type Client = {
    connectionId: string;
    nickname: string;
};

export type SendMessageBody = {
    recipientNickname: string;
    message: string;
};

export type GetMessagesBody = {
    targetNickname: string;
    startKey: Key | undefined;
    limit: number;
};