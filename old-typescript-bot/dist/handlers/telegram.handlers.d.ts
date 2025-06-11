import { Context, NarrowedContext } from 'telegraf';
import { Update, Message } from 'telegraf/typings/core/types/typegram';
type MessageContext = NarrowedContext<Context<Update>, Update.MessageUpdate<Message.TextMessage>>;
export declare const startHandler: (ctx: MessageContext) => Promise<void>;
export declare const weeklyWeaveHandler: (ctx: MessageContext) => Promise<void>;
export declare const eventHandler: (ctx: MessageContext) => Promise<void>;
export declare const updateHandler: (ctx: MessageContext) => Promise<void>;
export declare const unknownCommandHandler: (ctx: MessageContext) => Promise<void>;
export {};
//# sourceMappingURL=telegram.handlers.d.ts.map