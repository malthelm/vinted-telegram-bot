import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Register all commands with the bot.
 * @param {Telegraf} bot - The Telegraf bot instance.
 */
export function registerCommands(bot) {
    try {
        // Get the commands directory
        const commandsDir = path.join(__dirname, 'commands');
        
        // Check if the directory exists
        if (!fs.existsSync(commandsDir)) {
            Logger.error(`Commands directory not found: ${commandsDir}`);
            return;
        }
        
        // Read all command files
        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
        
        // Register each command
        for (const file of commandFiles) {
            const commandPath = path.join(commandsDir, file);
            import(commandPath).then(command => {
                if (command.default && typeof command.default === 'function') {
                    command.default(bot);
                    Logger.info(`Registered command from ${file}`);
                } else {
                    Logger.warn(`Command file ${file} does not export a default function`);
                }
            }).catch(error => {
                Logger.error(`Error importing command ${file}: ${error.message}`);
            });
        }
        
        // Set up the bot's commands list for the menu
        const commandList = commandFiles.map(file => {
            const name = file.replace('.js', '');
            const description = getCommandDescription(name);
            return { command: name, description };
        });
        
        bot.telegram.setMyCommands(commandList).then(() => {
            Logger.info('Bot commands menu updated');
        }).catch(error => {
            Logger.error(`Failed to update bot commands menu: ${error.message}`);
        });
    } catch (error) {
        Logger.error(`Error registering commands: ${error.message}`);
    }
}

/**
 * Get a description for a command.
 * @param {string} command - The command name.
 * @returns {string} The command description.
 */
function getCommandDescription(command) {
    const descriptions = {
        start: 'Start the bot',
        help: 'Show help information',
        monitor: 'Start monitoring a Vinted search URL',
        stop: 'Stop monitoring a specific search',
        list: 'List all your active monitors',
        filter: 'Add keyword filters to a monitor',
        settings: 'Change your settings',
        admin: 'Admin commands (admin only)'
    };
    
    return descriptions[command] || 'No description available';
} 