<?php

namespace CCS\Models\Entities;

class User
{

    private ?string $id = null;
    private ?string $name = null;
    private ?string $password = null;
    private ?int $year = null;
    private ?string $speciality = null;
    private ?string $faculty = null;
    private ?string $role = null;

    public function __construct()
    {
    }

    public static function fill($id, $name, $password, $year, $speciality, $faculty, $role)
    {
        $instance = new self();
        $instance->id = $id;
        $instance->name = $name;
        $instance->password = $password;
        $instance->year = $year;
        $instance->speciality = $speciality;
        $instance->faculty = $faculty;
        $instance->role = $role;
        return $instance;
    }

    public function __get($prop)
    {
        if (property_exists($this, $prop)) {
            return $this->{$prop};
        }
    }

    public function __set($prop, $value)
    {
        if (property_exists($this, $prop)) {
            $this->{$prop} = $value;
        }
    }

    public static function fromDto($dto)
    {
        $instance = new self();
        foreach (get_object_vars($instance) as $key => $_) {
            $instance->{$key} = $dto->{$key};
        }
        return $instance;
    }

    public static function fromArray(array $arr)
    {
        $instance = new self();
        foreach (get_object_vars($instance) as $key => $_) {
            if (isset($arr[$key])) {
                $instance->{$key} = $arr[$key];
            }
        }
        return $instance;
    }
}
