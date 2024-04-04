import {Client} from "./types";
import {CLIENTS_TABLE_NAME, docClient, postToConnection, responseOK} from "./helpers";
import {APIGatewayProxyResult} from "aws-lambda";
import {HandlerError} from "./HandleError";

export const notifyClientChange = async (excludedConnectionId: string) => {
    const clients = await getAllClients();

    await Promise.all(
        clients.map(async (c) => {
            if (excludedConnectionId === c.connectionId) {
                return;
            }

            await postToConnection(
                c.connectionId,
                JSON.stringify({ type: "clients", value: clients }),
            );
        }),
    );
};

export const getAllClients = async (): Promise<Client[]> => {
    const output = await docClient
        .scan({
            TableName: CLIENTS_TABLE_NAME,
        })
        .promise();

    const clients = output.Items || [];

    return clients as Client[];
};

export const handleGetClients = async (connectionId: string): Promise<APIGatewayProxyResult> => {
    await postToConnection(
        connectionId,
        JSON.stringify({
            type: "clients",
            value: await getAllClients(),
        }),
    );

    return responseOK;
};

export const getClient = async (connectionId: string) => {
    const output = await docClient
        .get({
            TableName: CLIENTS_TABLE_NAME,
            Key: {
                connectionId,
            },
        })
        .promise();

    if (!output.Item) {
        throw new HandlerError("client does not exist");
    }

    return output.Item as Client;
};
