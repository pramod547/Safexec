"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseRules = void 0;
exports.databaseRules = [
    {
        id: 'DB001',
        name: 'Drop Database or Schema',
        category: 'database',
        riskLevel: 'critical',
        description: 'Completely drops a database or schema along with all its tables and records.',
        recommendedChecks: [
            'Confirm connection string is pointing to local development, not production/staging.',
            'Take a database dump or backup before proceeding.'
        ],
        evaluate: (segment) => {
            const raw = segment.raw;
            const dropDbMatch = raw.match(/\bDROP\s+(DATABASE|SCHEMA)\s+(?:IF\s+EXISTS\s+)?([`"']?[A-Za-z0-9_]+[`"']?)/i);
            if (dropDbMatch) {
                return {
                    id: 'DB001',
                    ruleName: 'Drop Database or Schema',
                    category: 'database',
                    riskLevel: 'critical',
                    title: `Database/Schema Destruction (${dropDbMatch[1].toUpperCase()})`,
                    description: `Permanently deletes database or schema "${dropDbMatch[2]}".`,
                    affectedTarget: dropDbMatch[2],
                    recommendedChecks: [
                        'Verify current database host and target environment.',
                        'Ensure recent snapshot or dump exists.'
                    ],
                    matchedSegment: segment.raw
                };
            }
            return null;
        }
    },
    {
        id: 'DB002',
        name: 'Drop or Truncate Table',
        category: 'database',
        riskLevel: 'high',
        description: 'Permanently removes table structure or purges all rows from tables.',
        recommendedChecks: [
            'Verify target table name.',
            'Ensure a recent backup or seed script is available.'
        ],
        evaluate: (segment) => {
            const raw = segment.raw;
            const dropTableMatch = raw.match(/\b(DROP\s+TABLE|TRUNCATE\s+TABLE|TRUNCATE)\s+(?:IF\s+EXISTS\s+)?([`"']?[A-Za-z0-9_]+[`"']?)/i);
            if (dropTableMatch) {
                return {
                    id: 'DB002',
                    ruleName: 'Drop or Truncate Table',
                    category: 'database',
                    riskLevel: 'high',
                    title: `Table Destruction (${dropTableMatch[1].toUpperCase()})`,
                    description: `Deletes table or purges all records from "${dropTableMatch[2]}".`,
                    affectedTarget: dropTableMatch[2],
                    recommendedChecks: [
                        'Check which database connection is active.',
                        'Confirm table data can be regenerated or restored.'
                    ],
                    matchedSegment: segment.raw
                };
            }
            return null;
        }
    },
    {
        id: 'DB003',
        name: 'Broad Delete Operation',
        category: 'database',
        riskLevel: 'high',
        description: 'Executes DELETE FROM without a WHERE clause, which deletes all rows in the table.',
        recommendedChecks: [
            'Add a specific WHERE condition (e.g. id = ...).',
            'Run a SELECT count(*) first with the intended condition.'
        ],
        evaluate: (segment) => {
            const raw = segment.raw;
            const deleteMatch = raw.match(/\bDELETE\s+FROM\s+([`"']?[A-Za-z0-9_]+[`"']?)(?!.*WHERE\b)/i);
            if (deleteMatch && !raw.toLowerCase().includes('where')) {
                return {
                    id: 'DB003',
                    ruleName: 'Broad Delete Operation',
                    category: 'database',
                    riskLevel: 'high',
                    title: 'Unconditional Table Purge (DELETE without WHERE)',
                    description: `Attempts to delete all rows from table "${deleteMatch[1]}".`,
                    affectedTarget: deleteMatch[1],
                    recommendedChecks: [
                        'Add an explicit WHERE clause.',
                        'Run a transaction or dry-run SELECT first.'
                    ],
                    matchedSegment: segment.raw
                };
            }
            return null;
        }
    },
    {
        id: 'DB004',
        name: 'Destructive Migration Reset',
        category: 'database',
        riskLevel: 'high',
        description: 'Resets or drops the database schema using an ORM or migration CLI.',
        recommendedChecks: [
            'Check DATABASE_URL environment variable to ensure it is not production.',
            'Back up existing development data.'
        ],
        evaluate: (segment) => {
            const raw = segment.raw.toLowerCase();
            const destructivePatterns = [
                { regex: /prisma\s+migrate\s+reset/i, target: 'Prisma DB Reset' },
                { regex: /rails\s+db:drop/i, target: 'Rails DB Drop' },
                { regex: /rails\s+db:reset/i, target: 'Rails DB Reset' },
                { regex: /typeorm\s+schema:drop/i, target: 'TypeORM Schema Drop' },
                { regex: /flask\s+db\s+downgrade\s+base/i, target: 'Flask Base Downgrade' },
                { regex: /knex\s+migrate:rollback\s+--all/i, target: 'Knex Rollback All' }
            ];
            for (const pattern of destructivePatterns) {
                if (pattern.regex.test(raw)) {
                    return {
                        id: 'DB004',
                        ruleName: 'Destructive Migration Reset',
                        category: 'database',
                        riskLevel: 'high',
                        title: `Migration Reset Command (${pattern.target})`,
                        description: 'This migration command drops database tables and resets migrations.',
                        affectedTarget: pattern.target,
                        recommendedChecks: [
                            'Verify the active database connection target.',
                            'Ensure data seeds are up to date if you intend to re-populate.'
                        ],
                        matchedSegment: segment.raw
                    };
                }
            }
            return null;
        }
    }
];
//# sourceMappingURL=databaseRules.js.map