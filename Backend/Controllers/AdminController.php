<?php

namespace CCS\Controllers;

use CCS\Services\AdminService;
use CCS\Models\DTOs as DTOs;

require_once(APP_ROOT . "/Services/AdminService.php");
foreach (glob(APP_ROOT . '/Models/DTOs.php') as $file) {
    require_once($file);
};

class AdminController {
    
    public static function getAllDisabledMessages() {
        echo json_encode(AdminService::getAllDisabledMessages(), JSON_FLAGS);
    }

    public static function getAllUsers() {
        echo json_encode(AdminService::getAllUsers(), JSON_FLAGS);
    }

    public static function getAllChatRooms() {
        echo json_encode(AdminService::getAllChatRooms(), JSON_FLAGS);
    }

    public static function createChatRoom() {
        $chatRoomDto = call_user_func('CCS\Models\Mappers\ChatRoomMapper::toDto', json_decode(file_get_contents('php://input'), true));
        AdminService::createChatRoom($chatRoomDto);
        echo json_encode(new DTOs\ResponseDtoSuccess(201, "Chatroom created successfully."));
    }

    public static function addUserToChatRoom() {
        $userChatDto = call_user_func('CCS\Models\Mappers\UserChatMapper::toDto', json_decode(file_get_contents('php://input'), true));
        AdminService::addUserToChatRoom($userChatDto);
        echo json_encode(new DTOs\ResponseDtoSuccess(200, "User added to chatroom successfully."));
    }

    public static function updateChatRoomActive() {
        $chatRoomDto = call_user_func('CCS\Models\Mappers\ChatRoomMapper::toDto', json_decode(file_get_contents('php://input'), true));
        AdminService::updateChatRoomActive($chatRoomDto);
        echo json_encode(new DTOs\ResponseDtoSuccess(200, "Chatroom updated successfully."));
    }

    public static function removeUserFromChat() {
        $userId = $_GET['userId'] ?? null;
        $chatRoomId = $_GET['chatRoomId'] ?? null;
        AdminService::updateChatRoomActive($userId, $chatRoomId);
        echo json_encode(new DTOs\ResponseDtoSuccess(200, "User removed successfully."));
    }

    public static function deleteMessageById() {
        $messageDto = call_user_func('CCS\Models\Mappers\MessageMapper::toDto', json_decode(file_get_contents('php://input'), true));
        AdminService::deleteMessageById($messageDto->{'id'});
        echo json_encode(new DTOs\ResponseDtoSuccess(200, "Message deleted successfully."));
    }

    public static function deleteChatRoomById() {
        $chatRoomDto = call_user_func('CCS\Models\Mappers\ChatRoomMapper::toDto', json_decode(file_get_contents('php://input'), true));
        AdminService::deleteMessageById($chatRoomDto->{'id'});
        echo json_encode(new DTOs\ResponseDtoSuccess(200, "Chatroom deleted successfully."));
    }
}