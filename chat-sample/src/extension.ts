import * as vscode from 'vscode';

const CODE_BLOCK_COMMAND_ID = 'code.blocksInEditor';
const CODE_PARTICIPANT_ID = 'chat-sample.code';

interface ICodeChatResult extends vscode.ChatResult {
    metadata: {
        command: string;
    }
}

const MODEL_SELECTOR: vscode.LanguageModelChatSelector = { vendor: 'copilot', family: 'gpt-4' };

const instructions = `Provide answers strictly in the form of code blocks, omitting explanations unless explicitly requested or absolutely necessary for understanding the code. 
        Focus on delivering valid and error-free solutions, and engages only with programming-related questions, asking for clarifications if the input is unclear.
        Do not say anything that is not code, and avoid using comments in the code blocks.`

export function activate(context: vscode.ExtensionContext) {

    // Define a Code chat handler. 
    const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<ICodeChatResult> => {
        // To talk to an LLM in your subcommand handler implementation, your
        // extension can use VS Code's `requestChatAccess` API to access the Copilot API.
        // The GitHub Copilot Chat extension implements this provider.
        stream.progress('Processing your request...');
        
        const messages = [
            vscode.LanguageModelChatMessage.User(instructions),
            vscode.LanguageModelChatMessage.User(request.prompt)
        ];
        const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
        const chatResponse = await model.sendRequest(messages, {}, token);
        for await (const fragment of chatResponse.text) {
            stream.markdown(fragment);
        }

        return { metadata: { command: '' } };
    };

    // Chat participants appear as top-level options in the chat input
    // when you type `@`, and can contribute sub-commands in the chat input
    // that appear when you type `/`.
    const code = vscode.chat.createChatParticipant(CODE_PARTICIPANT_ID, handler);
    code.iconPath = vscode.Uri.joinPath(context.extensionUri, 'code_icon.png'); // Update with an appropriate icon path
    code.followupProvider = {
        provideFollowups(result: ICodeChatResult, context: vscode.ChatContext, token: vscode.CancellationToken) {
            return [{
                prompt: 'Show more examples',
                label: vscode.l10n.t('Show more examples'),
                command: 'example'
            } satisfies vscode.ChatFollowup];
        }
    };

    context.subscriptions.push(
        code,
        // Register the command handler for the /code followup
        vscode.commands.registerTextEditorCommand(CODE_BLOCK_COMMAND_ID, async (textEditor: vscode.TextEditor) => {
            // Replace all content in the active editor with code blocks from the response
            const text = textEditor.document.getText();
            const messages = [
            vscode.LanguageModelChatMessage.User(instructions),
            vscode.LanguageModelChatMessage.User(text)
            ];

            let chatResponse: vscode.LanguageModelChatResponse | undefined;
            try {
                const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4' });
                chatResponse = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);

            } catch (err) {
                // making the chat request might fail because
                // - model does not exist
                // - user consent not given
                // - quote limits exceeded
                if (err instanceof vscode.LanguageModelError) {
                    console.log(err.message, err.code, err.cause)
                }
                return
            }

            // Clear the editor content before inserting new content
            await textEditor.edit(edit => {
                const start = new vscode.Position(0, 0);
                const end = new vscode.Position(textEditor.document.lineCount - 1, textEditor.document.lineAt(textEditor.document.lineCount - 1).text.length);
                edit.delete(new vscode.Range(start, end));
            });

            // Stream the code into the editor as it is coming in from the Language Model
            try {
                for await (const fragment of chatResponse.text) {
                    await textEditor.edit(edit => {
                        const lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);
                        const position = new vscode.Position(lastLine.lineNumber, lastLine.text.length);
                        edit.insert(position, `\n\`\`\`\n${fragment}\n\`\`\`\n`);
                    });
                }
            } catch (err) {
                // async response stream may fail, e.g network interruption or server side error
                await textEditor.edit(edit => {
                    const lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);
                    const position = new vscode.Position(lastLine.lineNumber, lastLine.text.length);
                    edit.insert(position, (<Error>err).message);
                });
            }
        }),
    );
}

export function deactivate() { }
