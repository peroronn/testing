import os
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CallbackContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_URL = os.getenv('API_URL')

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
    user_id = update.message.from_user.id
    context.user_data['stage'] = 'add_space'
    await update.message.reply_text('Please provide the space name.')

# (Include the rest of your handler functions here like handle_message, view, finish, and delete)
