import os
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CallbackContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_URL = os.getenv('API_URL')

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
                all_data += f"{item['space_name']:<20} {item['subspace_name']:<20} {item['item_name']:<20} {item['item_qty']:<5} {item['alert_qty']:<10} {item['exp_date']:<10}\n"
            all_data += "```"
            await query.edit_message_text(all_data, parse_mode='Markdown')
        else:
            await query.edit_message_text(f'Failed to retrieve data. Status code: {response.status_code}, Response: {response.text}')

    # (Include the rest of your callback functions here like view_space, view_subspace, delete_space, delete_subspace, and delete_item)
