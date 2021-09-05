export namespace AuthChallenge {
    const $schema: string;
    const title: string;
    const description: string;
    const type: string;
    namespace properties {
        namespace challenge {
            const type_1: string;
            export { type_1 as type };
            export const pattern: string;
        }
        namespace pubKey {
            const type_2: string;
            export { type_2 as type };
            const pattern_1: string;
            export { pattern_1 as pattern };
        }
        namespace answerURI {
            const type_3: string;
            export { type_3 as type };
            export const format: string;
        }
    }
    const additionalProperties: boolean;
    const required: string[];
}
//# sourceMappingURL=index.d.ts.map