import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackContext, CallbackQueryHandler, filters
from dotenv import load_dotenv
import requests

# Load environment variables from .env file
load_dotenv()

# Telegram bot token and API URL from environment variables
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
API_URL = os.getenv('API_URL')

# Define command handlers and other functions
async def start(update: Update, context: CallbackContext) -> None:
    commands_text = (
        "Welcome! Here are the available commands:\n"
        "/add_space - Add a new space\n"
        "/view - View all data\n"
        "/finish - Finish adding items\n"
        "/delete - Delete spaces, subspaces, or items\n"
        "/help - Show this help message again"
    )
    await update.message.reply_text(commands_text)

async def add_space(update: Update, context: CallbackContext) -> None:
    context.user_data['stage'] = 'add_space'
    await update.message.reply_text('Please provide the space name.')

async def handle_message(update: Update, context: CallbackContext) -> None:
    user_id = update.message.from_user.id
    stage = context.user_data.get('stage')

    if stage == 'add_space':
        spacename = update.message.text
        response = requests.post(f'{API_URL}/spaces', json={'user_id': user_id, 'name': spacename})
        if response.status_code == 201:
            data = response.json()
            context.user_data['space_id'] = data['_id']  # Extract the space_id from the response data
            await update.message.reply_text(f"Space '{spacename}' added with ID {context.user_data['space_id']}. Please provide the subspace name.")
            context.user_data['stage'] = 'add_subspace'
        else:
            await update.message.reply_text('Failed to add space.')

    elif stage == 'add_subspace':
        subspacename = update.message.text
        space_id = context.user_data.get('space_id')
        response = requests.post(f'{API_URL}/subspaces', json={'spaceid': space_id, 'name': subspacename})
        if response.status_code == 201:
            data = response.json()
            context.user_data['subspace_id'] = data['_id']  # Extract the subspace_id from the response data
            await update.message.reply_text(f"Subspace '{subspacename}' added with ID {context.user_data['subspace_id']}. Please provide the item details in the format: <item_name> <item_qty> <alert_qty> <exp_date>.")
            context.user_data['stage'] = 'add_item'
        else:
            await update.message.reply_text('Failed to add subspace.')

    elif stage == 'add_item':
        item_details = update.message.text.split()
        if len(item_details) < 4:
            await update.message.reply_text('Invalid format. Please provide the item details in the format: <item_name> <item_qty> <alert_qty> <exp_date>.')
            return

        itemname = item_details[0]
        itemqty = int(item_details[1])
        alertqty = int(item_details[2])
        expdate = item_details[3]
        subspace_id = context.user_data.get('subspace_id')

        response = requests.post(f'{API_URL}/items', json={
            'subspaceid': subspace_id,
            'name': itemname,
            'qty': itemqty,
            'alertqty': alertqty,
            'expdate': expdate
        })
        if response.status_code == 201:
            data = response.json()
            await update.message.reply_text(f"Item '{itemname}' added with ID {data['_id']}. You can continue adding items by providing the item details in the format: <item_name> <item_qty> <alert_qty> <exp_date> or type /finish to complete.")
        else:
            await update.message.reply_text('Failed to add item.')

async def view(update: Update, context: CallbackContext) -> None:
    keyboard = [
        [InlineKeyboardButton("View All Spaces", callback_data='view_all_spaces')]
    ]
    
    response = requests.get(f'{API_URL}/spaces')
    if response.status_code == 200:
        spaces = response.json()
        keyboard.extend([[InlineKeyboardButton(space['name'], callback_data=f"view_space_{space['_id']}")] for space in spaces])
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text('Select an option:', reply_markup=reply_markup)
    else:
        await update.message.reply_text(f'Failed to retrieve spaces. Status code: {response.status_code}, Response: {response.text}')

async def finish(update: Update, context: CallbackContext) -> None:
    context.user_data['stage'] = 'start'
    await update.message.reply_text('Item adding process completed.')

async def delete(update: Update, context: CallbackContext) -> None:
    keyboard = [
        [InlineKeyboardButton("Delete Space", callback_data='delete_space')],
        [InlineKeyboardButton("Delete Subspace", callback_data='delete_subspace')],
        [InlineKeyboardButton("Delete Item", callback_data='delete_item')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text('Choose an option:', reply_markup=reply_markup)

async def handle_callback(update: Update, context: CallbackContext) -> None:
    query = update.callback_query
    await query.answer()

    if query.data == 'view_all_spaces':
        response = requests.get(f'{API_URL}/view')
        if response.status_code == 200:
            data = response.json()
            all_data = "```\n"
            all_data += f"{'Space Name':<20} {'Subspace Name':<20} {'Item Name':<20} {'Qty':<5} {'Alert Qty':<10} {'Exp Date':<10}\n"
            all_data += "-" * 85 + "\n"
            for item in data:
                all_data += f"{item['space_name']:<20} {item['subspace_name']:<20} {item['item_name']:<20} {item['qty']:<5} {item['alertqty']:<10} {item['expdate']:<10}\n"
            all_data += "```"
            await query.edit_message_text(all_data, parse_mode='Markdown')
        else:
            await query.edit_message_text(f'Failed to retrieve data. Status code: {response.status_code}, Response: {response.text}')

    elif query.data.startswith('view_space_'):
        space_id = query.data.split('_')[-1]
        response = requests.get(f'{API_URL}/subspaces/{space_id}')
        if response.status_code == 200:
            subspaces = response.json()
            keyboard = [[InlineKeyboardButton(subspace['name'], callback_data=f"view_subspace_{subspace['_id']}")] for subspace in subspaces]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text('Select a subspace to view:', reply_markup=reply_markup)
        else:
            await query.edit_message_text(f'Failed to retrieve subspaces. Status code: {response.status_code}, Response: {response.text}')

    elif query.data.startswith('view_subspace_'):
        subspace_id = query.data.split('_')[-1]
        response = requests.get(f'{API_URL}/items/{subspace_id}')
        if response.status_code == 200:
            items = response.json()
            all_data = "```\n"
            all_data += f"{'Item Name':<20} {'Qty':<5} {'Alert Qty':<10} {'Exp Date':<10}\n"
            all_data += "-" * 50 + "\n"
            for item in items:
                all_data += f"{item['name']:<20} {item['qty']:<5} {item['alertqty']:<10} {item['expdate']:<10}\n"
            all_data += "```"
            await query.edit_message_text(all_data, parse_mode='Markdown')
        else:
            await query.edit_message_text(f'Failed to retrieve items. Status code: {response.status_code}, Response: {response.text}')

    elif query.data == 'delete_space':
        response = requests.get(f'{API_URL}/spaces')
        if response.status_code == 200:
            spaces = response.json()
            keyboard = [[InlineKeyboardButton(space['name'], callback_data=f"delete_space_{space['_id']}")] for space in spaces]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text('Select a space to delete:', reply_markup=reply_markup)
        else:
            await query.edit_message_text(f'Failed to retrieve spaces. Status code: {response.status_code}, Response: {response.text}')

    elif query.data.startswith('delete_space_'):
        space_id = query.data.split('_')[-1]
        response = requests.delete(f'{API_URL}/spaces/{space_id}')
        if response.status_code == 200:
            await query.edit_message_text(f'Space with ID {space_id} deleted successfully.')
        else:
            await query.edit_message_text(f'Failed to delete space. Status code: {response.status_code}, Response: {response.text}')

    elif query.data == 'delete_subspace':
        response = requests.get(f'{API_URL}/subspaces')
        if response.status_code == 200:
            subspaces = response.json()
            keyboard = [[InlineKeyboardButton(subspace['name'], callback_data=f"delete_subspace_{subspace['_id']}")] for subspace in subspaces]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text('Select a subspace to delete:', reply_markup=reply_markup)
        else:
            await query.edit_message_text(f'Failed to retrieve subspaces. Status code: {response.status_code}, Response: {response.text}')

    elif query.data.startswith('delete_subspace_'):
        subspace_id = query.data.split('_')[-1]
        response = requests.delete(f'{API_URL}/subspaces/{subspace_id}')
        if response.status_code == 200:
            await query.edit_message_text(f'Subspace with ID {subspace_id} deleted successfully.')
        else:
            await query.edit_message_text(f'Failed to delete subspace. Status code: {response.status_code}, Response: {response.text}')

    elif query.data == 'delete_item':
        response = requests.get(f'{API_URL}/items')
        if response.status_code == 200:
            items = response.json()
            keyboard = [[InlineKeyboardButton(item['name'], callback_data=f"delete_item_{item['_id']}")] for item in items]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text('Select an item to delete:', reply_markup=reply_markup)
        else:
            await query.edit_message_text(f'Failed to retrieve items. Status code: {response.status_code}, Response: {response.text}')

    elif query.data.startswith('delete_item_'):
        item_id = query.data.split('_')[-1]
        response = requests.delete(f'{API_URL}/items/{item_id}')
        if response.status_code == 200:
            await query.edit_message_text(f'Item with ID {item_id} deleted successfully.')
        else:
            await query.edit_message_text(f'Failed to delete item. Status code: {response.status_code}, Response: {response.text}')

# Main function to start the bot
def main() -> None:
    application = Application.builder().token(TELEGRAM_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("add_space", add_space))
    application.add_handler(CommandHandler("view", view))
    application.add_handler(CommandHandler("finish", finish))
    application.add_handler(CommandHandler("delete", delete))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    application.add_handler(CallbackQueryHandler(handle_callback))

    application.run_polling()

if __name__ == '__main__':
    main()
