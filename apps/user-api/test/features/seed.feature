@seed
Feature: 회원 가입 기능

  Scenario: 회원 가입
    Given 사용자 정보를 fixture에서 가져옴
    When 사용자가 "register" 타입으로 Email OTP 발급을 요청한다
    Then 사용자가 OTP를 검증했다
    And 사용자가 Email 회원가입을 시도한다
    Then 사용자가 이메일 로그인에 성공했다


